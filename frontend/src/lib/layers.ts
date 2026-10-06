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
  toJSON(propertiesToInclude?: string[]): Record<string, unknown>;
  getObjects(): LayerObject[];
  loadFromJSON(json: unknown, callback: () => void): unknown;
  backgroundImage?: unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setBackgroundImage(image: any, callback: () => void): unknown;
  viewportTransform?: number[];
  setViewportTransform(vpt: number[]): unknown;
  renderAll(): unknown;
}

/**
 * Calques seuls (texte, stickers) : l'image de fond est volontairement exclue.
 * Avant, chaque état d'historique embarquait la photo en base64 (jusqu'à
 * ~13 Mo × 50 états) et la sauvegarde mélangeait photo et calques.
 */
export function serializeLayers(canvas: LayeredCanvas): CanvasLayers {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { backgroundImage, ...layers } = canvas.toJSON(["data"]);
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
export function restoreLayers(canvas: LayeredCanvas, layers: CanvasLayers | string, done?: () => void) {
  const background = canvas.backgroundImage;
  const viewport = canvas.viewportTransform?.slice();

  // loadFromJSON vide le canvas (fond compris) et réinitialise le zoom.
  canvas.loadFromJSON(layers, () => {
    if (background) canvas.setBackgroundImage(background, () => {});
    if (viewport) canvas.setViewportTransform(viewport);
    applyLocks(canvas);
    canvas.renderAll();
    done?.();
  });
}
