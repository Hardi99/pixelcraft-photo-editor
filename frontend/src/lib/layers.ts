import type { CanvasLayers } from "@/types";

/**
 * Sous-ensemble de fabric.Canvas utilisé ici. Ce module n'importe pas Fabric :
 * il reste testable en Node et ne charge pas la lib dans le store.
 */
export interface LayerObject {
  data?: { id?: string; locked?: boolean };
  set(options: Record<string, unknown>): unknown;
}

export interface LayeredCanvas {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toObject(propertiesToInclude?: any[]): Record<string, unknown>;
  getObjects(): LayerObject[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loadFromJSON(json: any): Promise<unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  backgroundImage?: any;
  viewportTransform: number[] | readonly number[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setViewportTransform(vpt: any): unknown;
  requestRenderAll(): unknown;
}

/**
 * Calques seuls (texte, stickers) : l'image de fond est volontairement exclue.
 * Avant, chaque état d'historique embarquait la photo en base64 (jusqu'à
 * ~13 Mo × 50 états) et la sauvegarde mélangeait photo et calques.
 */
export function serializeLayers(canvas: LayeredCanvas): CanvasLayers {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // toJSON() ne prend plus d'argument depuis Fabric 6 : toObject inclut le champ data
  const { backgroundImage, ...layers } = canvas.toObject(["data"]);
  return layers;
}

export function snapshot(canvas: LayeredCanvas): string {
  return JSON.stringify(serializeLayers(canvas));
}

/** Propriétés Fabric d'un élément verrouillé : ni déplacement, ni transformation, ni édition. */
export function lockProps(locked: boolean) {
  return {
    lockMovementX: locked,
    lockMovementY: locked,
    lockScalingX: locked,
    lockScalingY: locked,
    lockRotation: locked,
    hasControls: !locked,
    editable: !locked,
  };
}

/** Le verrou est stocké dans data.locked (sérialisé) ; on le réapplique après chaque chargement. */
export function applyLocks(canvas: LayeredCanvas) {
  for (const obj of canvas.getObjects()) obj.set(lockProps(!!obj.data?.locked));
}

/** Remplace les calques en conservant l'image de fond et le zoom courants. */
export async function restoreLayers(canvas: LayeredCanvas, layers: CanvasLayers | string) {
  const background = canvas.backgroundImage;
  const viewport = [...canvas.viewportTransform];

  // loadFromJSON vide le canvas (fond compris) et peut réinitialiser le zoom.
  await canvas.loadFromJSON(typeof layers === "string" ? JSON.parse(layers) : layers);
  if (background) canvas.backgroundImage = background;
  canvas.setViewportTransform(viewport);
  applyLocks(canvas);
  canvas.requestRenderAll();
}
