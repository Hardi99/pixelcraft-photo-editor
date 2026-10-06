import { deflateSync } from "node:zlib";
import { expect, type Page } from "@playwright/test";

// ---------- Images de test (générées, sans fichier binaire dans le dépôt) ----------

function crc32(buf: Buffer) {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type: string, data: Buffer) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** PNG en dégradé (un filtre doit avoir quelque chose à modifier). */
export function makePng(width: number, height: number): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // 8 bits par canal
  header[9] = 2; // RGB
  const rows = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    const offset = y * (width * 3 + 1);
    for (let x = 0; x < width; x++) {
      rows[offset + 1 + x * 3] = Math.round((x / width) * 255);
      rows[offset + 2 + x * 3] = Math.round((y / height) * 200) + 30;
      rows[offset + 3 + x * 3] = 140;
    }
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(rows)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Largeur et hauteur lues dans l'en-tête IHDR d'un PNG. */
export function pngSize(png: Buffer) {
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

// ---------- Actions ----------

export const PHOTO = { width: 1200, height: 800 };

export async function openEditor(page: Page) {
  await page.goto("/");
  await expect(page.getByText("Déposez une photo ici")).toBeVisible();
}

export async function importFile(page: Page, file: { name: string; mimeType: string; buffer: Buffer }) {
  await page.locator('input[type="file"]').setInputFiles(file);
}

export async function importPhoto(page: Page, size = PHOTO) {
  await importFile(page, { name: "photo.png", mimeType: "image/png", buffer: makePng(size.width, size.height) });
  await expect.poll(() => editor(page, (s) => s.history.length)).toBeGreaterThan(0);
}

export async function chooseFormat(page: Page, ratio: string) {
  await page.getByRole("button", { name: "Format", exact: true }).click();
  // Le nom accessible d'un bouton de format commence par le ratio : « 9:16 Story »
  await page.getByRole("button", { name: new RegExp(`^${ratio} `) }).click();
  await expect.poll(() => editor(page, (s) => s.aspectRatio)).toBe(ratio);
  await expect.poll(() => editor(page, (s) => s.history.length)).toBeGreaterThan(0);
}

export async function addText(page: Page, text: string, at = { x: 0.5, y: 0.5 }) {
  await page.getByRole("button", { name: "Texte", exact: true }).click();
  const box = (await page.locator(".upper-canvas").boundingBox())!;
  await page.mouse.click(box.x + box.width * at.x, box.y + box.height * at.y);
  await page.keyboard.type(text);
  await page.keyboard.press("Escape");
}

export async function applyFilter(page: Page, label: string) {
  await page.getByRole("radio", { name: new RegExp(label) }).click();
}

export async function exportAs(page: Page, format: "PNG" | "JPEG" = "PNG") {
  await page.getByRole("button", { name: "Exporter", exact: true }).click();
  await page.getByText(format, { exact: true }).click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Télécharger" }).click(),
  ]);
  const stream = await download.createReadStream();
  const parts: Buffer[] = [];
  for await (const part of stream) parts.push(part as Buffer);
  return { name: download.suggestedFilename(), buffer: Buffer.concat(parts) };
}

// ---------- Lecture de l'état de l'éditeur (point d'accès exposé en dev) ----------

type Snapshot = {
  aspectRatio: string;
  selectedFilter: string;
  history: unknown[];
  texts: { text: string; fill: string; hasShadow: boolean; filters: number }[];
  background: { naturalWidth: number; naturalHeight: number; filters: number; coversCanvas: boolean } | null;
};

export function editor<T>(page: Page, pick: (s: Snapshot) => T): Promise<T> {
  return page
    .evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = (window as any).__pixelcraft.store.getState();
      const canvas = s.canvas;
      const bg = canvas?.backgroundImage;
      const zoom = canvas?.getZoom() ?? 1;
      return {
        aspectRatio: s.aspectRatio,
        selectedFilter: s.selectedFilter,
        history: s.history,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        texts: (canvas?.getObjects() ?? []).filter((o: any) => o.type === "i-text").map((o: any) => ({
          text: o.text,
          fill: o.fill,
          hasShadow: !!o.shadow,
          filters: o.filters?.length ?? 0,
        })),
        background: bg
          ? {
              // Avec un filtre, Fabric affiche un canvas filtré ; la photo source reste dans _originalElement
              naturalWidth: (bg._originalElement ?? bg.getElement()).naturalWidth,
              naturalHeight: (bg._originalElement ?? bg.getElement()).naturalHeight,
              filters: bg.filters?.length ?? 0,
              coversCanvas:
                bg.getScaledWidth() * zoom >= canvas.getWidth() - 1 && bg.getScaledHeight() * zoom >= canvas.getHeight() - 1,
            }
          : null,
      };
    })
    .then(pick);
}
