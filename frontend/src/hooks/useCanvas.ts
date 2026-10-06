import { useCallback } from "react";
import { fabric } from "fabric";
import { useQueryClient } from "@tanstack/react-query";
import { useEditorStore } from "@/stores/editorStore";
import { api } from "@/lib/api";
import { snapshot } from "@/lib/layers";
import { applyFilters, buildFilters, canvasToBlob, renderAtSize } from "@/lib/scene";
import { EXPORT_FORMATS, EXPORT_TARGETS, exportFileName, type ExportFormat } from "@/lib/exportPresets";
import { trackEdit } from "@/lib/tracking";
import { downloadFile } from "@/lib/utils";
import type { ImageAdjustments } from "@/types";
import { toast } from "sonner";

// Lit l'état au moment de l'action (getState) plutôt que de s'abonner au store :
// les composants qui utilisent ce hook ne re-rendent pas à chaque modification.
const editor = () => useEditorStore.getState();

function addObject(obj: fabric.Object) {
  const { canvas, pushHistory } = editor();
  if (!canvas) return;
  obj.set({ data: { id: crypto.randomUUID() } });
  canvas.add(obj);
  canvas.setActiveObject(obj);
  canvas.renderAll();
  pushHistory(snapshot(canvas));
}

export function useCanvas() {
  const qc = useQueryClient();

  const applyInstagramFilter = useCallback((filterName: string) => {
    const { canvas, adjustments, setSelectedFilter } = editor();
    if (!canvas) return;
    setSelectedFilter(filterName);
    applyFilters(canvas, buildFilters(filterName, adjustments));
    trackEdit("filter", { filter: filterName });
  }, []);

  const applyAdjustment = useCallback((key: keyof ImageAdjustments, value: number) => {
    const { canvas, selectedFilter, setAdjustments } = editor();
    if (!canvas) return;
    setAdjustments({ [key]: value });
    applyFilters(canvas, buildFilters(selectedFilter, editor().adjustments));
  }, []);

  const addText = useCallback((text = "Double-cliquez pour éditer") => {
    addObject(
      new fabric.IText(text, {
        left: 80,
        top: 80,
        fontSize: 36,
        fill: "#ffffff",
        fontFamily: "Arial",
        fontWeight: "bold",
        shadow: new fabric.Shadow({ color: "rgba(0,0,0,0.6)", blur: 8, offsetX: 2, offsetY: 2 }),
      })
    );
    trackEdit("text");
  }, []);

  const addSticker = useCallback((emoji: string) => {
    addObject(new fabric.Text(emoji, { left: 100, top: 100, fontSize: 64 }));
    trackEdit("sticker", { emoji });
  }, []);

  const deleteSelected = useCallback(() => {
    const { canvas, pushHistory } = editor();
    const obj = canvas?.getActiveObject();
    if (!obj) return;
    canvas.remove(obj);
    canvas.discardActiveObject();
    canvas.renderAll();
    pushHistory(snapshot(canvas));
  }, []);

  /** Exporte aux dimensions exactes de la destination, puis télécharge ou partage le fichier. */
  const exportImage = useCallback(
    async (format: ExportFormat, mode: "download" | "share" = "download") => {
      const { canvas, aspectRatio, projectTitle, currentProject, setCurrentProject } = editor();
      if (!canvas) return;
      const target = EXPORT_TARGETS[aspectRatio];
      const { mime, label } = EXPORT_FORMATS[format];

      let file: File;
      try {
        const blob = await canvasToBlob(renderAtSize(canvas, target.width, target.height), mime);
        file = new File([blob], exportFileName(projectTitle, target, format), { type: mime });
      } catch {
        return toast.error("L'image n'a pas pu être générée. Réessayez.");
      }

      if (mode === "share" && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: projectTitle });
        } catch (error) {
          if ((error as DOMException).name === "AbortError") return; // partage annulé : rien n'est exporté
          downloadFile(file);
        }
      } else {
        downloadFile(file);
      }
      toast.success(`Image exportée en ${target.width} × ${target.height} px (${label})`);

      // Projet enregistré : le serveur incrémente le compteur (atomique) et trace l'export.
      const details = { target: target.id, format };
      if (!currentProject) return trackEdit("export", details);
      try {
        setCurrentProject(await api.projects.export(currentProject.id, details));
        qc.invalidateQueries({ queryKey: ["projects"] });
      } catch {
        // L'export local a réussi ; seul le compteur n'a pas pu être mis à jour.
      }
    },
    [qc]
  );

  return { addText, addSticker, deleteSelected, applyInstagramFilter, applyAdjustment, exportImage };
}
