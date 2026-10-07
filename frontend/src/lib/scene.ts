import { FabricImage, filters as fabricFilters, type Canvas, type filters as FiltersNS } from "fabric";
import { FILTER_PRESETS } from "@/lib/filters";
import type { ImageAdjustments } from "@/types";

type Filter = InstanceType<(typeof FiltersNS)[keyof typeof FiltersNS]>;
type FilterClass = new (options: object) => Filter;

/** Preset Instagram + réglages manuels empilés par-dessus. */
export function buildFilters(presetName: string, adj: ImageAdjustments): Filter[] {
  const filters: Filter[] = [];
  const preset = FILTER_PRESETS.find((f) => f.name === presetName);
  const classes = fabricFilters as unknown as Record<string, FilterClass>;

  for (const { type, options } of preset?.fabricFilters ?? []) {
    if (classes[type]) filters.push(new classes[type](options));
  }
  if (adj.brightness !== 0) filters.push(new fabricFilters.Brightness({ brightness: adj.brightness }));
  if (adj.contrast !== 0) filters.push(new fabricFilters.Contrast({ contrast: adj.contrast }));
  if (adj.saturation !== 0) filters.push(new fabricFilters.Saturation({ saturation: adj.saturation }));
  if (adj.blur > 0) filters.push(new fabricFilters.Blur({ blur: adj.blur }));
  return filters;
}

export function applyFilters(canvas: Canvas, filters: Filter[]) {
  const img = canvas.backgroundImage;
  if (!(img instanceof FabricImage)) return;
  img.filters = filters;
  img.applyFilters();
  canvas.requestRenderAll();
}

/**
 * Pose la photo en fond, en mode « cover » (remplit le format, rogne le surplus).
 * Les dimensions sont logiques (avant zoom), comme les coordonnées des calques.
 */
export async function loadBackground(
  canvas: Canvas,
  url: string,
  size: { w: number; h: number },
  filters: Filter[] = [],
): Promise<FabricImage> {
  // crossOrigin requis pour exporter une image servie par le backend sans « tainter » le canvas
  const img = await FabricImage.fromURL(url, { crossOrigin: "anonymous" });
  if (!img.width || !img.height) throw new Error("Image illisible");
  const scale = Math.max(size.w / img.width, size.h / img.height);
  img.set({
    // Fabric 7 ancre les objets au centre par défaut : on centre la photo sur la page
    originX: "center",
    originY: "center",
    left: size.w / 2,
    top: size.h / 2,
    scaleX: scale,
    scaleY: scale,
    selectable: false,
    evented: false,
  });
  img.filters = filters;
  img.applyFilters();
  canvas.backgroundImage = img;
  canvas.requestRenderAll();
  return img;
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

export function canvasThumbnail(canvas: Canvas, width = 480): Promise<Blob> {
  const dataUrl = canvas.toDataURL({ format: "jpeg", quality: 0.8, multiplier: width / canvas.getWidth() });
  return fetch(dataUrl).then((res) => res.blob());
}

/**
 * Rend la scène aux dimensions exactes demandées, quelle que soit la taille
 * d'affichage du canvas (l'ancien export « × 2 » dépendait de la fenêtre).
 */
export function renderAtSize(canvas: Canvas, width: number, height: number): HTMLCanvasElement {
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
