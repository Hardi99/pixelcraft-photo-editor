import { test, expect, type Page } from "@playwright/test";
import { addText, editor, importPhoto, openEditor } from "./helpers";

// Les identifiants (US3-1…) renvoient aux critères de docs/user-stories.md.

const firstText = (page: Page) => editor(page, (s) => s.texts[0]);
const pageCenter = (page: Page) => editor(page, (s) => ({ x: s.page.w / 2, y: s.page.h / 2 }));
const center = (box: { left: number; top: number; width: number; height: number }) => ({
  x: box.left + box.width / 2,
  y: box.top + box.height / 2,
});

async function openTab(page: Page, name: "Effets" | "Position") {
  await page.getByRole("tab", { name }).click();
}

test.beforeEach(async ({ page }) => {
  await openEditor(page);
  await importPhoto(page);
});

test.describe("US3 — Écrire un texte qui a du style", () => {
  test("US3-1 · un titre prêt apparaît centré, mis en forme, prêt à être modifié", async ({ page }) => {
    await addText(page, "SOLDES", "title");

    const text = await firstText(page);
    expect(text).toMatchObject({ text: "SOLDES", fontFamily: "Anton", fontSize: 110, fill: "#ffffff", hasShadow: true });
    const c = center(text.box);
    const p = await pageCenter(page);
    // reste centré après la saisie : le texte s'élargit des deux côtés
    expect(Math.abs(c.x - p.x)).toBeLessThan(2);
    expect(Math.abs(c.y - p.y)).toBeLessThan(2);
  });

  test("US3-2 · les polices sont montrées dans leur fonte et appliquées au texte", async ({ page }) => {
    await addText(page, "Bonjour");
    await page.getByRole("button", { name: "Police" }).click();

    const option = page.getByRole("option", { name: "Pacifico" });
    await expect(option).toHaveCSS("font-family", /Pacifico/);
    await option.click();

    await expect.poll(() => firstText(page).then((t) => t.fontFamily)).toBe("Pacifico");
    expect(await page.evaluate(() => document.fonts.check('16px "Pacifico"'))).toBe(true);
  });

  test("US3-3 · taille, gras, italique, alignement", async ({ page }) => {
    await addText(page, "Style");
    const before = (await firstText(page)).fontSize;

    await page.getByRole("button", { name: "Augmenter la taille" }).click();
    await page.getByRole("button", { name: "Gras" }).click();
    await page.getByRole("button", { name: "Italique" }).click();
    await page.getByRole("button", { name: "Aligner à droite" }).click();

    expect(await firstText(page)).toMatchObject({
      fontSize: before + 2,
      fontWeight: "700",
      fontStyle: "italic",
      textAlign: "right",
    });
  });

  test("US3-4 · contour, ombre, surlignage, espacement, majuscules", async ({ page }) => {
    await addText(page, "effets");

    await page.getByRole("switch", { name: "Contour" }).click();
    await page.getByRole("switch", { name: "Ombre" }).click(); // désactive l'ombre par défaut
    await page.getByRole("switch", { name: "Surlignage" }).click();
    const spacing = page.getByRole("slider", { name: "Espacement des lettres" });
    await spacing.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.getByRole("button", { name: "Majuscules" }).click();

    expect(await firstText(page)).toMatchObject({
      text: "EFFETS",
      stroke: "#000000",
      strokeWidth: 4,
      hasShadow: false,
      textBackgroundColor: "#111111",
      charSpacing: 20,
    });
  });

  test("US3-5 · police et effets sont restaurés à la réouverture", async ({ page }) => {
    await addText(page, "Fidèle", "subtitle");
    await page.getByRole("switch", { name: "Contour" }).click();
    await page.getByRole("switch", { name: "Surlignage" }).click();
    const saved = await firstText(page);

    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Projet enregistré dans Mes projets")).toBeVisible();
    await page.getByRole("button", { name: "Nouvelle photo" }).click();
    await page.getByRole("button", { name: "Mes projets" }).click();
    await page.getByRole("button", { name: "Ouvrir" }).first().click();

    await expect.poll(() => editor(page, (s) => s.texts.length)).toBe(1);
    expect(await firstText(page)).toMatchObject({
      text: "Fidèle",
      fontFamily: saved.fontFamily,
      stroke: saved.stroke,
      strokeWidth: saved.strokeWidth,
      textBackgroundColor: saved.textBackgroundColor,
    });
  });
});

test.describe("US8 — Mettre en page les éléments", () => {
  test("US8-1 · un élément déplacé près du centre s'y aimante", async ({ page }) => {
    await addText(page, "Aimant");
    await openTab(page, "Position");
    await page.getByRole("button", { name: "Aligner à gauche de la page" }).click();

    // On le fait glisser jusqu'à 5 px (écran) du centre de la page
    const canvas = (await page.locator(".upper-canvas").boundingBox())!;
    const zoom = await page.evaluate(() => (window as any).__pixelcraft.store.getState().canvas.getZoom());
    const box = (await firstText(page)).box;
    const p = await pageCenter(page);
    const from = { x: canvas.x + center(box).x * zoom, y: canvas.y + center(box).y * zoom };
    const to = { x: canvas.x + p.x * zoom + 5, y: from.y };
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 10 });
    await page.mouse.up();

    const after = center((await firstText(page)).box);
    expect(Math.abs(after.x - p.x)).toBeLessThan(0.5);
  });

  test("US8-2 · aligner sur la page", async ({ page }) => {
    await addText(page, "Coin");
    await openTab(page, "Position");

    await page.getByRole("button", { name: "Aligner à gauche de la page" }).click();
    await page.getByRole("button", { name: "Aligner en bas de la page" }).click();

    const { box } = await firstText(page);
    const { h } = await editor(page, (s) => s.page);
    expect(box.left).toBeCloseTo(0, 0);
    expect(box.top + box.height).toBeCloseTo(h, 0);
  });

  test("US8-3 · premier plan et arrière-plan", async ({ page }) => {
    await addText(page, "Dessous");
    await addText(page, "Dessus");
    expect(await editor(page, (s) => s.texts.map((t) => t.text))).toEqual(["Dessous", "Dessus"]);

    await openTab(page, "Position");
    await page.getByRole("button", { name: "Arrière-plan" }).click(); // « Dessus » est sélectionné

    expect(await editor(page, (s) => s.texts.map((t) => t.text))).toEqual(["Dessus", "Dessous"]);
    expect(await editor(page, (s) => s.background)).not.toBeNull(); // la photo reste en fond
  });

  test("US8-4 · dupliquer avec Ctrl+D", async ({ page }) => {
    await addText(page, "Copie");
    await page.keyboard.press("Control+d");

    await expect.poll(() => editor(page, (s) => s.texts.length)).toBe(2);
    const [original, copy] = await editor(page, (s) => s.texts);
    expect(copy.text).toBe("Copie");
    expect(copy.box.left).toBeGreaterThan(original.box.left);
  });

  test("US8-5 · un élément verrouillé ne bouge pas, ne se supprime pas, et reste verrouillé", async ({ page }) => {
    await addText(page, "Fixe");
    await openTab(page, "Position");
    await page.getByRole("button", { name: "Verrouiller" }).click();
    const before = (await firstText(page)).box;

    // Tentative de déplacement
    const canvas = (await page.locator(".upper-canvas").boundingBox())!;
    const zoom = await page.evaluate(() => (window as any).__pixelcraft.store.getState().canvas.getZoom());
    const c = center(before);
    await page.mouse.move(canvas.x + c.x * zoom, canvas.y + c.y * zoom);
    await page.mouse.down();
    await page.mouse.move(canvas.x + c.x * zoom + 80, canvas.y + c.y * zoom + 60, { steps: 5 });
    await page.mouse.up();
    // Tentative de suppression
    await page.keyboard.press("Delete");

    const after = await firstText(page);
    expect(after.locked).toBe(true);
    expect(after.box.left).toBeCloseTo(before.left, 1);
    expect(after.box.top).toBeCloseTo(before.top, 1);
    await expect(page.getByText("Texte verrouillé")).toBeVisible();
  });
});

const rotationOf = (page: Page) =>
  page.evaluate(() => (window as any).__pixelcraft.store.getState().canvas.getActiveObject().angle as number);

/** Position écran d'une poignée de l'élément sélectionné (« tr », « rotateTr »…). */
async function handle(page: Page, name: string) {
  const canvas = (await page.locator(".upper-canvas").boundingBox())!;
  const point = await page.evaluate((key) => (window as any).__pixelcraft.store.getState().canvas.getActiveObject().oCoords[key], name);
  return { x: canvas.x + point.x, y: canvas.y + point.y };
}
const topRightCorner = (page: Page) => handle(page, "tr");

test("US8-6 · quatre poignées d'angle et curseur main", async ({ page }) => {
  await addText(page, "Poignées", "title");

  // Seules les poignées d'angle sont dessinées (les zones de rotation sont invisibles)
  const drawn = await page.evaluate(() => {
    const obj = (window as any).__pixelcraft.store.getState().canvas.getActiveObject();
    return Object.entries(obj.controls)
      .filter(([key, control]: [string, any]) => obj.isControlVisible(key) && control.actionName !== "rotate")
      .map(([key]) => key)
      .sort();
  });
  expect(drawn).toEqual(["bl", "br", "tl", "tr"]);
  expect(await page.evaluate(() => "mtr" in (window as any).__pixelcraft.store.getState().canvas.getActiveObject().controls)).toBe(false);

  // Curseur : main au survol, main fermée pendant le déplacement
  const canvas = (await page.locator(".upper-canvas").boundingBox())!;
  const zoom = await page.evaluate(() => (window as any).__pixelcraft.store.getState().canvas.getZoom());
  const c = center((await firstText(page)).box);
  const cursor = () => page.locator(".upper-canvas").evaluate((el) => getComputedStyle(el).cursor);

  await page.mouse.move(canvas.x + c.x * zoom, canvas.y + c.y * zoom);
  await expect.poll(cursor).toBe("grab");
  await page.mouse.down();
  await page.mouse.move(canvas.x + c.x * zoom + 30, canvas.y + c.y * zoom + 10, { steps: 4 });
  await expect.poll(cursor).toBe("grabbing");
  await page.mouse.up();

  // Sur un coin (et jusqu'à 5 px autour) : flèche diagonale, le redimensionnement prime sur la rotation
  const corner = await topRightCorner(page);
  for (const [dx, dy] of [[0, 0], [4, -4], [-4, 4]]) {
    await page.mouse.move(corner.x + dx, corner.y + dy);
    await expect.poll(cursor).toBe("nesw-resize");
  }
  const bottomRight = await handle(page, "br");
  await page.mouse.move(bottomRight.x, bottomRight.y);
  await expect.poll(cursor).toBe("nwse-resize");

  // Tirer un coin agrandit sans déformer : même échelle horizontale et verticale
  await page.mouse.move(corner.x, corner.y);
  await page.mouse.down();
  await page.mouse.move(corner.x + 40, corner.y - 20, { steps: 6 });
  await page.mouse.up();
  const scale = await page.evaluate(() => {
    const o = (window as any).__pixelcraft.store.getState().canvas.getActiveObject();
    return { x: o.scaleX, y: o.scaleY };
  });
  expect(scale.x).toBeGreaterThan(1);
  expect(scale.x).toBeCloseTo(scale.y, 5);
});

/** Fait tourner l'élément sélectionné de `degrees` en glissant depuis l'extérieur du coin haut-droit. */
async function rotateBy(page: Page, degrees: number, modifiers: string[] = []) {
  // La zone de rotation tourne avec l'élément : on vise sa position réelle
  const start = await handle(page, "rotateTr");
  const canvas = (await page.locator(".upper-canvas").boundingBox())!;
  const pivotLocal = await page.evaluate(() => (window as any).__pixelcraft.store.getState().canvas.getActiveObject().getCenterPoint());
  const zoom = await page.evaluate(() => (window as any).__pixelcraft.store.getState().canvas.getZoom());
  const pivot = { x: canvas.x + pivotLocal.x * zoom, y: canvas.y + pivotLocal.y * zoom };
  const radius = Math.hypot(start.x - pivot.x, start.y - pivot.y);
  const from = Math.atan2(start.y - pivot.y, start.x - pivot.x);

  // Survol d'abord, comme un vrai geste : Fabric repère la zone de rotation au survol
  await page.mouse.move(start.x - 2, start.y + 2);
  await page.mouse.move(start.x, start.y);
  for (const key of modifiers) await page.keyboard.down(key);
  await page.mouse.down();
  for (let step = 1; step <= 12; step++) {
    const a = from + ((degrees * Math.PI) / 180) * (step / 12);
    await page.mouse.move(pivot.x + radius * Math.cos(a), pivot.y + radius * Math.sin(a));
  }
  await page.mouse.up();
  for (const key of modifiers.reverse()) await page.keyboard.up(key);
}

test("US8-7 · rotation depuis l'extérieur d'un coin, aimantée tous les 45°", async ({ page }) => {
  await addText(page, "Rotation", "title");
  const cursor = () => page.locator(".upper-canvas").evaluate((el) => getComputedStyle(el).cursor);

  // Juste à l'extérieur du coin haut-droit : curseur de rotation (flèche dessinée en SVG)
  const corner = await topRightCorner(page);
  await page.mouse.move(corner.x + 10, corner.y - 10);
  await expect.poll(cursor).toContain("url(");

  // 30° : loin d'un multiple de 45°, l'angle suit le geste
  await rotateBy(page, 30);
  expect(Math.abs((await rotationOf(page)) - 30)).toBeLessThan(2);

  // +13° (total 43°) : à moins de 5° de 45°, l'élément s'aimante
  await rotateBy(page, 13);
  expect(await rotationOf(page)).toBe(45);
});

test("US8-8 · avec Maj ou Alt Gr, la rotation se cale par paliers de 15°", async ({ page }) => {
  await addText(page, "Droit", "title");

  // Sans touche : 37° reste 37° (à plus de 5° de 45°)
  await rotateBy(page, 37);
  expect(Math.abs((await rotationOf(page)) - 37)).toBeLessThan(2);

  // Avec Maj : +20° (57° au total) se cale sur le palier de 15° le plus proche, 60°
  await rotateBy(page, 20, ["Shift"]);
  expect(await rotationOf(page)).toBe(60);

  // Avec Alt Gr (Ctrl+Alt sous Windows) : -28° (32°) se cale sur 30°
  await rotateBy(page, -28, ["Control", "Alt"]);
  expect(await rotationOf(page)).toBe(30);
});

test.describe("US9 — Utiliser PixelCraft sur l'écran adapté", () => {
  for (const [w, h] of [[1024, 768], [1280, 720], [1366, 768], [1440, 900], [1920, 1080]] as const) {
    test(`US9-1 · ${w} × ${h} : pas de défilement horizontal, aucun bouton coupé`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await addText(page, "Titre", "title");
      await page.waitForTimeout(300);

      const layout = await page.evaluate(() => ({
        horizontalScroll: document.documentElement.scrollWidth > innerWidth,
        clipped: [...document.querySelectorAll("header button, aside button, [role=toolbar] button")]
          .filter((b) => {
            const r = b.getBoundingClientRect();
            return r.width > 0 && (r.right > innerWidth + 1 || r.bottom > innerHeight + 1);
          })
          .map((b) => b.getAttribute("aria-label") ?? b.textContent?.trim()),
      }));
      expect(layout).toEqual({ horizontalScroll: false, clipped: [] });
    });
  }

  test("US9-2 · sur téléphone, un message remplace l'éditeur ; Mes projets reste accessible", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await expect(page.getByRole("heading", { name: "PixelCraft s'utilise sur ordinateur ou tablette" })).toBeVisible();
    await expect(page.locator(".upper-canvas")).toBeHidden();
    await page.getByRole("main").getByRole("button", { name: "Mes projets" }).click();
    await expect(page.getByText("Aucun projet enregistré")).toBeVisible(); // nouveau visiteur : galerie vide
  });
});
