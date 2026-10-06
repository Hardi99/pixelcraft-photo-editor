import { useCallback } from "react";
import { fabric } from "fabric";
import { useQueryClient } from "@tanstack/react-query";
import { useEditorStore, CANVAS_SIZES } from "@/stores/editorStore";
import { api } from "@/lib/api";
import { snapshot } from "@/lib/layers";
import { applyFilters, buildFilters, canvasToBlob, renderAtSize } from "@/lib/scene";
import { EXPORT_FORMATS, EXPORT_TARGETS, exportFileName, type ExportFormat } from "@/lib/exportPresets";
import { trackEdit } from "@/lib/tracking";
import { BASE_TEXT_STYLE, TEXT_PRESETS, ensureFontLoaded, isText, type TextPresetId } from "@/lib/text";
import { duplicateObject, isLocked, moveBy, pageBox, setLocked } from "@/lib/objects";
import { alignOnPage, type PageAlign } from "@/lib/snapping";
import { downloadFile } from "@/lib/utils";
import type { ImageAdjustments } from "@/types";
import { toast } from "sonner";

// Lit l'état au moment de l'action (getState) plutôt que de s'abonner au store :
// les composants qui utilisent ce hook ne re-rendent pas à chaque modification.
const editor = () => useEditorStore.getState();

/** Fin commune de toute modification : historique + rafraîchissement des panneaux. */
function commit() {
  const { canvas, pushHistory, bumpSelection } = editor();
  if (!canvas) return;
  canvas.requestRenderAll();
  pushHistory(snapshot(canvas));
  bumpSelection();
}

function activeObject(): fabric.Object | null {
  return editor().canvas?.getActiveObject() ?? null;
}

/** Ajoute un élément centré sur la page et le sélectionne. */
function addCentered(obj: fabric.Object) {
  const { canvas, aspectRatio } = editor();
  if (!canvas) return;
  const page = CANVAS_SIZES[aspectRatio];
  obj.set({ data: { id: crypto.randomUUID() } });
  canvas.add(obj);
  const box = pageBox(obj);
  moveBy(obj, (page.w - box.width) / 2 - box.left, (page.h - box.height) / 2 - box.top);
  canvas.setActiveObject(obj);
  commit();
}

// ---------- Texte (US3) ----------

async function addText(presetId: TextPresetId) {
  const preset = TEXT_PRESETS[presetId];
  await ensureFontLoaded(preset.options.fontFamily!, preset.options.fontWeight);
  const text = new fabric.IText(preset.text, {
    ...BASE_TEXT_STYLE,
    // Une ombre par texte : un objet Shadow partagé serait modifié pour tous
    shadow: new fabric.Shadow({ color: "rgba(0,0,0,0.45)", blur: 12, offsetX: 0, offsetY: 4 }),
    ...preset.options,
  });
  addCentered(text);
  text.enterEditing();
  text.selectAll();
  editor().setActiveTool("select");
  trackEdit("text", { preset: presetId });
}

/** Modifie le texte sélectionné (police, taille, couleur, effets…). */
async function updateText(props: Partial<fabric.IText>) {
  const obj = activeObject();
  if (!isText(obj) || isLocked(obj)) return;
  if (props.fontFamily) {
    await ensureFontLoaded(props.fontFamily, props.fontWeight ?? obj.fontWeight);
    fabric.util.clearFabricFontCache(props.fontFamily);
  }
  obj.set(props);
  obj.initDimensions();
  obj.setCoords();
  commit();
}

/** Aperçu en direct pendant un glissement de curseur, sans entrée d'historique. */
function previewText(props: Partial<fabric.IText>) {
  const obj = activeObject();
  if (!isText(obj) || isLocked(obj)) return;
  obj.set(props);
  obj.initDimensions();
  obj.setCoords();
  editor().canvas?.requestRenderAll();
  editor().bumpSelection();
}

function setTextShadow(shadow: { color: string; blur: number; distance: number } | null, { live = false } = {}) {
  const obj = activeObject();
  if (!isText(obj) || isLocked(obj)) return;
  obj.set({ shadow: shadow ? new fabric.Shadow({ color: shadow.color, blur: shadow.blur, offsetX: 0, offsetY: shadow.distance }) : undefined });
  if (live) {
    editor().canvas?.requestRenderAll();
    editor().bumpSelection();
  } else commit();
}

/** Enregistre l'état courant dans l'historique (fin d'un glissement de curseur). */
function commitChange() {
  commit();
}

function uppercaseText() {
  const obj = activeObject();
  if (!isText(obj) || isLocked(obj)) return;
  obj.set({ text: (obj.text ?? "").toLocaleUpperCase("fr-FR") });
  obj.initDimensions();
  commit();
}

// ---------- Mise en page (US8) ----------

function alignActive(where: PageAlign) {
  const { canvas, aspectRatio } = editor();
  const obj = activeObject();
  if (!canvas || !obj || isLocked(obj)) return;
  const { dx, dy } = alignOnPage(pageBox(obj), CANVAS_SIZES[aspectRatio], where);
  moveBy(obj, dx, dy);
  commit();
}

function arrangeActive(where: "front" | "forward" | "backward" | "back") {
  const { canvas } = editor();
  const obj = activeObject();
  if (!canvas || !obj) return;
  if (where === "front") canvas.bringToFront(obj);
  if (where === "forward") canvas.bringForward(obj);
  if (where === "backward") canvas.sendBackwards(obj);
  if (where === "back") canvas.sendToBack(obj); // la photo est un fond, elle reste dessous
  commit();
}

async function duplicateActive() {
  const { canvas } = editor();
  const obj = activeObject();
  if (!canvas || !obj) return;
  await duplicateObject(canvas, obj);
  commit();
}

function toggleLockActive() {
  const obj = activeObject();
  if (!obj) return;
  setLocked(obj, !isLocked(obj));
  commit();
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

  const addSticker = useCallback((emoji: string) => {
    addCentered(new fabric.Text(emoji, { fontSize: 120 }));
    trackEdit("sticker", { emoji });
  }, []);

  const deleteSelected = useCallback(() => {
    const { canvas } = editor();
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj || isLocked(obj)) return;
    canvas.remove(obj);
    canvas.discardActiveObject();
    commit();
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

  return {
    addText,
    addSticker,
    deleteSelected,
    applyInstagramFilter,
    applyAdjustment,
    exportImage,
    updateText,
    previewText,
    commitChange,
    setTextShadow,
    uppercaseText,
    alignActive,
    arrangeActive,
    duplicateActive,
    toggleLockActive,
  };
}
