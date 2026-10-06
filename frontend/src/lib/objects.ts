import { fabric } from "fabric";
import { lockProps } from "@/lib/layers";
import type { Box } from "@/lib/snapping";

export const isLocked = (obj: fabric.Object | null | undefined) => !!obj?.data?.locked;

/** Boîte englobante en coordonnées de la page (indépendantes du zoom d'affichage). */
export function pageBox(obj: fabric.Object): Box {
  const { left, top, width, height } = obj.getBoundingRect(true, true);
  return { left, top, width, height };
}

export function moveBy(obj: fabric.Object, dx: number, dy: number) {
  obj.set({ left: (obj.left ?? 0) + dx, top: (obj.top ?? 0) + dy });
  obj.setCoords();
}

export function setLocked(obj: fabric.Object, locked: boolean) {
  obj.set({ data: { ...obj.data, locked }, ...lockProps(locked) });
}

/** Copie décalée, déverrouillée et avec son propre identifiant ; elle devient la sélection. */
export function duplicateObject(canvas: fabric.Canvas, obj: fabric.Object, offset = 24): Promise<fabric.Object> {
  return new Promise((resolve) => {
    obj.clone((copy: fabric.Object) => {
      copy.set({ left: (copy.left ?? 0) + offset, top: (copy.top ?? 0) + offset, data: { ...obj.data, id: crypto.randomUUID() } });
      setLocked(copy, false);
      canvas.add(copy);
      canvas.setActiveObject(copy);
      canvas.requestRenderAll();
      resolve(copy);
    }, ["data"]);
  });
}
