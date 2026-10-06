import { fabric } from "fabric";
import { FILTER_PRESETS } from "@/lib/filters";
import type { ImageAdjustments } from "@/types";

type FilterClass = new (options: object) => fabric.IBaseFilter;

/** Preset Instagram + réglages manuels empilés par-dessus. */
export function buildFilters(presetName: string, adj: ImageAdjustments): fabric.IBaseFilter[] {
  const filters: fabric.IBaseFilter[] = [];
  const preset = FILTER_PRESETS.find((f) => f.name === presetName);
  const classes = fabric.Image.filters as unknown as Record<string, FilterClass>;

  for (const { type, options } of preset?.fabricFilters ?? []) {
    if (classes[type]) filters.push(new classes[type](options));
  }
  if (adj.brightness !== 0) filters.push(new fabric.Image.filters.Brightness({ brightness: adj.brightness }));
  if (adj.contrast !== 0) filters.push(new fabric.Image.filters.Contrast({ contrast: adj.contrast }));
  if (adj.saturation !== 0) filters.push(new fabric.Image.filters.Saturation({ saturation: adj.saturation }));
  if (adj.blur > 0) filters.push(new fabric.Image.filters.Blur({ blur: adj.blur }));
  return filters;
}

export function applyFilters(canvas: fabric.Canvas, filters: fabric.IBaseFilter[]) {
  const img = canvas.backgroundImage;
  if (!(img instanceof fabric.Image)) return;
  img.filters = filters;
  img.applyFilters();
  canvas.renderAll();
}

/**
 * Pose la photo en fond, en mode « cover » (remplit le format, rogne le surplus).
 * Les dimensions sont logiques (avant zoom), comme les coordonnées des calques.
 */
export function loadBackground(
  canvas: fabric.Canvas,
  url: string,
  size: { w: number; h: number },
  filters: fabric.IBaseFilter[] = [],
): Promise<fabric.Image> {
  return new Promise((resolve, reject) => {
    fabric.Image.fromURL(
      url,
      (img) => {
        if (!img.width || !img.height) return reject(new Error("Image illisible"));
        const scale = Math.max(size.w / img.width, size.h / img.height);
        img.set({
          scaleX: scale,
          scaleY: scale,
          left: (size.w - img.width * scale) / 2,
          top: (size.h - img.height * scale) / 2,
          selectable: false,
          evented: false,
        });
        img.filters = filters;
        img.applyFilters();
        canvas.setBackgroundImage(img, () => {
          canvas.renderAll();
          resolve(img);
        });
      },
      // Requis pour exporter une image servie par le backend sans « tainter » le canvas.
      { crossOrigin: "anonymous" },
    );
  });
}

export function readAsDataURL(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Vérifie la signature binaire : l'extension et le type MIME déclarés se falsifient. */
export async function isPngOrJpeg(file: Blob): Promise<boolean> {
  const bytes = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return hex.startsWith("ffd8ff") || hex === "89504e47";
}

export function canvasThumbnail(canvas: fabric.Canvas, width = 480): Promise<Blob> {
  const dataUrl = canvas.toDataURL({ format: "jpeg", quality: 0.8, multiplier: width / canvas.getWidth() });
  return fetch(dataUrl).then((res) => res.blob());
}

/**
 * Rend la scène aux dimensions exactes demandées, quelle que soit la taille
 * d'affichage du canvas (l'ancien export « × 2 » dépendait de la fenêtre).
 */
export function renderAtSize(canvas: fabric.Canvas, width: number, height: number): HTMLCanvasElement {
  canvas.discardActiveObject();
  canvas.renderAll();
  const rendered = canvas.toCanvasElement(width / canvas.getWidth());
  if (rendered.width === width && rendered.height === height) return rendered;

  // Arrondis de Fabric (taille d'affichage fractionnaire) : on recadre au pixel près.
  const exact = document.createElement("canvas");
  exact.width = width;
  exact.height = height;
  exact.getContext("2d")?.drawImage(rendered, 0, 0, width, height);
  return exact;
}

export function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Export impossible"))), mime, quality)
  );
}
