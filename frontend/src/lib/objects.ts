import type { Canvas, FabricObject } from "fabric";
import { lockProps } from "@/lib/layers";
import type { Box } from "@/lib/snapping";

/** Champ libre de Fabric : ni sérialisé ni typé par défaut, on l'inclut à la sauvegarde (toObject(["data"])). */
export type ObjectData = { id?: string; locked?: boolean };
export const dataOf = (obj: FabricObject | null | undefined): ObjectData => ((obj as unknown as { data?: ObjectData })?.data ?? {});

export const isLocked = (obj: FabricObject | null | undefined) => !!dataOf(obj).locked;

/** Boîte englobante en coordonnées de la page (indépendantes du zoom d'affichage). */
export function pageBox(obj: FabricObject): Box {
  const { left, top, width, height } = obj.getBoundingRect();
  return { left, top, width, height };
}

export function moveBy(obj: FabricObject, dx: number, dy: number) {
  obj.set({ left: obj.left + dx, top: obj.top + dy });
  obj.setCoords();
}

export function setLocked(obj: FabricObject, locked: boolean) {
  obj.set({ data: { ...dataOf(obj), locked }, ...lockProps(locked) });
}

/** Copie décalée, déverrouillée et avec son propre identifiant ; elle devient la sélection. */
export async function duplicateObject(canvas: Canvas, obj: FabricObject, offset = 24): Promise<FabricObject> {
  const copy = await obj.clone(["data"]);
  copy.set({ left: copy.left + offset, top: copy.top + offset, data: { ...dataOf(obj), id: crypto.randomUUID() } });
  setLocked(copy, false);
  canvas.add(copy);
  canvas.setActiveObject(copy);
  canvas.requestRenderAll();
  return copy;
}
