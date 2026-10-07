import type { FabricObject } from "fabric";
import { useEditorStore } from "@/stores/editorStore";

/**
 * Élément sélectionné sur le canvas. Fabric n'est pas réactif : on s'abonne au
 * compteur selectionTick, incrémenté à chaque sélection ou modification, pour
 * que les panneaux se redessinent avec les propriétés à jour.
 */
export function useActiveObject(): FabricObject | null {
  useEditorStore((s) => s.selectionTick);
  const canvas = useEditorStore((s) => s.canvas);
  return canvas?.getActiveObject() ?? null;
}
