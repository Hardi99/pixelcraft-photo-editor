import { useEffect, useRef, useCallback } from "react";
import { Canvas as FabricCanvas, IText, type FabricObject } from "fabric";
import { useDropzone } from "react-dropzone";
import { Upload, ImageIcon } from "lucide-react";
import { useEditorStore, CANVAS_SIZES, DEFAULT_ADJUSTMENTS } from "@/stores/editorStore";
import { restoreLayers, serializeLayers, snapshot } from "@/lib/layers";
import { buildFilters, isPngOrJpeg, loadBackground, readAsDataURL } from "@/lib/scene";
import { trackEdit } from "@/lib/tracking";
import { refreshTextFonts } from "@/lib/text";
import { dataOf, duplicateObject, isLocked, moveBy, pageBox } from "@/lib/objects";
import { snapToPage } from "@/lib/snapping";
import { applyFabricTheme } from "@/lib/fabricTheme";
import { SafeZoneOverlay } from "@/components/Editor/SafeZoneOverlay";
import type { ActiveTool, CanvasLayers } from "@/types";
import { toast } from "sonner";

applyFabricTheme();

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MIN_DIMENSION = 50; // px
const SNAP_DISTANCE_PX = 8; // distance d'aimantation, en pixels à l'écran

export function Canvas() {
  // Hôte du canvas : un nouvel élément <canvas> est créé à chaque reconstruction de la
  // scène. Depuis Fabric 6, dispose() est asynchrone et réinitialiser le même élément
  // (StrictMode, changement de format) lève une erreur.
  const hostRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  // Calques du canvas précédent, reposés après un changement de format
  const carriedLayersRef = useRef<CanvasLayers | null>(null);
  // Vrai dès que le canvas affiche une image (scène chargée ou upload)
  const sceneReadyRef = useRef(false);
  // Copy/paste clipboard
  const clipboardRef = useRef<FabricObject | null>(null);

  const imageLoaded = useEditorStore((s) => s.imageLoaded);
  const aspectRatio = useEditorStore((s) => s.aspectRatio);
  const sceneId = useEditorStore((s) => s.sceneId);

  const { w: canvasW, h: canvasH } = CANVAS_SIZES[aspectRatio];

  const getScale = useCallback(() => {
    if (!containerRef.current) return 1;
    // Marges : 16 px de chaque côté, et une bande de 64 px en haut réservée à la
    // barre de texte flottante, pour qu'elle ne recouvre jamais la photo.
    const maxW = containerRef.current.clientWidth - 32;
    const maxH = containerRef.current.clientHeight - 64 - 16;
    return Math.min(maxW / canvasW, maxH / canvasH);
  }, [canvasW, canvasH]);

  // (Re)construit la scène : au montage, au changement de format, à l'ouverture d'un projet
  useEffect(() => {
    if (!hostRef.current) return;

    const scale = getScale();
    const element = document.createElement("canvas");
    hostRef.current.appendChild(element);
    const fc = new FabricCanvas(element, {
      width: canvasW * scale,
      height: canvasH * scale,
      backgroundColor: "#18181b",
      preserveObjectStacking: true,
      selection: true,
      hoverCursor: "grab", // main ouverte au survol d'un élément…
      moveCursor: "grabbing", // …fermée pendant le déplacement
    });
    fc.setZoom(scale);
    fabricRef.current = fc;

    const { imageUrl, pendingLayers, selectedFilter, adjustments, setCanvas, pushHistory } =
      useEditorStore.getState();
    setCanvas(fc);
    // Un projet rouvert a priorité sur les calques du canvas précédent.
    // L'historique repart à zéro : ses états ne s'appliquent qu'à un format donné.
    const layers = pendingLayers ?? carriedLayersRef.current;
    useEditorStore.setState({ pendingLayers: null, history: [], historyIndex: -1 });

    let disposed = false;
    sceneReadyRef.current = false;
    if (imageUrl) {
      loadBackground(fc, imageUrl, { w: canvasW, h: canvasH }, buildFilters(selectedFilter, adjustments))
        .then(() => {
          if (disposed) return;
          return layers ? restoreLayers(fc, layers) : undefined;
        })
        .then(() => {
          if (disposed) return;
          sceneReadyRef.current = true;
          pushHistory(snapshot(fc));
          void refreshTextFonts(fc); // un projet rouvert peut utiliser des polices pas encore chargées
        })
        .catch(() => toast.error("Impossible de charger l'image du projet."));
    }

    // Sélection : les panneaux (texte, mise en page) se relisent à chaque changement
    const onSelection = () => {
      setSelectedObjectId(dataOf(fc.getActiveObject()).id ?? null);
      useEditorStore.getState().bumpSelection();
    };
    fc.on("selection:created", onSelection);
    fc.on("selection:updated", onSelection);
    fc.on("selection:cleared", onSelection);

    // Repères magnétiques (US8-1) : dessinés sur le calque d'interaction de Fabric
    // (upper canvas), qui n'est jamais exporté.
    const clearGuides = () => fc.clearContext(fc.contextTop);
    fc.on("object:moving", (e) => {
      const obj = e.target;
      if (!obj) return;
      // Fabric 7 ne recalcule la boîte englobante qu'au relâchement : sans ceci,
      // l'aimantation mesurerait la position de l'étape précédente.
      obj.setCoords();
      const zoom = fc.getZoom();
      const snap = snapToPage(pageBox(obj), { w: canvasW, h: canvasH }, SNAP_DISTANCE_PX / zoom);
      if (snap.dx || snap.dy) moveBy(obj, snap.dx, snap.dy);

      clearGuides();
      const ctx = fc.contextTop;
      ctx.save();
      ctx.strokeStyle = "#F5A524";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      if (snap.guideX !== null) {
        ctx.beginPath();
        ctx.moveTo(snap.guideX * zoom + 0.5, 0);
        ctx.lineTo(snap.guideX * zoom + 0.5, fc.getHeight());
        ctx.stroke();
      }
      if (snap.guideY !== null) {
        ctx.beginPath();
        ctx.moveTo(0, snap.guideY * zoom + 0.5);
        ctx.lineTo(fc.getWidth(), snap.guideY * zoom + 0.5);
        ctx.stroke();
      }
      ctx.restore();
    });
    fc.on("mouse:up", clearGuides);

    // Historique après chaque modification (déplacement, redimensionnement, saisie de texte)
    fc.on("object:modified", () => {
      pushHistory(snapshot(fc));
      useEditorStore.getState().bumpSelection();
    });

    // Keyboard shortcuts
    const onKey = (e: KeyboardEvent) => {
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName ?? "");
      const active = fc.getActiveObject();
      const isEditingText = active instanceof IText && active.isEditing;
      if (typing || isEditingText) return;

      const mod = e.ctrlKey || e.metaKey;
      if ((e.key === "Delete" || e.key === "Backspace") && active) {
        if (isLocked(active)) return; // US8-5 : un élément verrouillé ne se supprime pas
        fc.remove(active);
        fc.discardActiveObject();
        fc.renderAll();
        pushHistory(snapshot(fc));
      } else if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        useEditorStore.getState().undo();
      } else if (mod && (e.key === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) {
        e.preventDefault();
        useEditorStore.getState().redo();
      } else if (mod && e.key.toLowerCase() === "d" && active) {
        e.preventDefault(); // sinon le navigateur ajoute un favori
        void duplicateObject(fc, active).then(() => {
          pushHistory(snapshot(fc));
          useEditorStore.getState().bumpSelection();
        });
      } else if (mod && e.key === "c" && active) {
        clipboardRef.current = active;
      } else if (mod && e.key === "v" && clipboardRef.current) {
        void duplicateObject(fc, clipboardRef.current).then(() => pushHistory(snapshot(fc)));
      } else if (!mod) {
        const toolMap: Record<string, ActiveTool> = { v: "select", t: "text", s: "sticker", r: "crop" };
        const tool = toolMap[e.key.toLowerCase()];
        if (tool) useEditorStore.getState().setActiveTool(tool);
      }
    };
    window.addEventListener("keydown", onKey);

    // Adapte l'affichage à la place disponible (fenêtre, panneau ouvert…) sans toucher aux calques
    const resizeObserver = new ResizeObserver(() => {
      const next = getScale();
      if (next <= 0 || Math.abs(next - fc.getZoom()) < 0.001) return;
      fc.setDimensions({ width: canvasW * next, height: canvasH * next });
      fc.setZoom(next);
    });
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      disposed = true;
      // Scène pas encore chargée (StrictMode, changement rapide) : on transmet
      // les calques prévus plutôt qu'un canvas encore vide.
      carriedLayersRef.current = sceneReadyRef.current ? serializeLayers(fc) : layers;
      window.removeEventListener("keydown", onKey);
      // Masque tout de suite l'ancienne scène ; dispose() termine le nettoyage en asynchrone
      fc.wrapperEl.style.display = "none";
      void fc.dispose().then(() => element.remove());
    };
    // getScale dépend du format : la scène est reconstruite uniquement sur ces deux signaux
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspectRatio, sceneId]);

  const loadFile = useCallback(
    async (file: File) => {
      const fc = fabricRef.current;
      if (!fc) return;

      if (file.size === 0) return toast.error("Fichier vide — impossible de charger l'image.");
      if (file.size > MAX_FILE_SIZE) {
        return toast.error(`Fichier trop lourd (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum : 10 MB.`);
      }
      if (!(await isPngOrJpeg(file))) return toast.error("Format non supporté. Seuls PNG et JPG sont acceptés.");

      try {
        const dataUrl = await readAsDataURL(file);
        const img = await loadBackground(fc, dataUrl, { w: canvasW, h: canvasH });
        if (img.width! < MIN_DIMENSION || img.height! < MIN_DIMENSION) {
          fc.backgroundImage = undefined;
          fc.requestRenderAll();
          return toast.error(`Image trop petite (${img.width}×${img.height}px). Minimum : ${MIN_DIMENSION}px.`);
        }

        fc.remove(...fc.getObjects());
        carriedLayersRef.current = null;
        sceneReadyRef.current = true;
        useEditorStore.setState({
          imageUrl: dataUrl,
          imageFile: file,
          imageLoaded: true,
          currentProject: null,
          selectedFilter: "normal",
          adjustments: DEFAULT_ADJUSTMENTS,
          history: [],
          historyIndex: -1,
          editingStartTime: Date.now(),
        });
        useEditorStore.getState().pushHistory(snapshot(fc));
        trackEdit("upload");
      } catch {
        toast.error("Impossible de lire cette image.");
      }
    },
    [canvasW, canvasH]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/png": [], "image/jpeg": [] },
    multiple: false,
    maxSize: MAX_FILE_SIZE,
    onDrop: (accepted, rejected) => {
      if (rejected.length > 0) {
        const code = rejected[0].errors[0]?.code;
        if (code === "file-invalid-type")
          toast.error("Format non supporté. Seuls PNG et JPG sont acceptés.");
        else if (code === "file-too-large")
          toast.error(`Fichier trop lourd. Maximum : 10 MB.`);
        else if (code === "too-many-files")
          toast.error("Déposez un seul fichier à la fois.");
        else
          toast.error("Fichier refusé.");
        return;
      }
      if (accepted[0]) void loadFile(accepted[0]);
    },
    noClick: imageLoaded,
    noDrag: imageLoaded,
  });

  return (
    <div
      ref={containerRef}
      className="relative flex min-w-0 flex-1 items-center justify-center overflow-hidden bg-stage pb-4 pt-16"
    >
      {!imageLoaded && (
        <div
          {...getRootProps()}
          className={`absolute inset-4 z-20 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed transition-colors sm:inset-10 ${
            isDragActive ? "border-safelight bg-safelight/5" : "border-paper/20 hover:border-paper/40"
          }`}
        >
          <input {...getInputProps()} aria-label="Choisir une photo" />
          <div className="flex max-w-xs flex-col items-center gap-5 px-6 text-center">
            <ImageIcon className={`h-10 w-10 ${isDragActive ? "text-safelight" : "text-paper/40"}`} strokeWidth={1.25} />
            <div>
              <p className="text-xl font-semibold tracking-tight text-paper">
                {isDragActive ? "Lâchez pour importer" : "Déposez une photo ici"}
              </p>
              <p className="mt-1.5 text-sm text-dim">PNG ou JPG, 10 Mo maximum.</p>
            </div>
            <span className="inline-flex h-9 items-center gap-2 rounded-md bg-paper px-4 text-sm font-semibold text-ink">
              <Upload className="h-4 w-4" />
              Choisir une photo
            </span>
          </div>
        </div>
      )}

      <div className={!imageLoaded ? "pointer-events-none opacity-0" : "relative shadow-[0_12px_40px_-8px_rgba(0,0,0,0.55)]"}>
        <div ref={hostRef} />
        <SafeZoneOverlay />
      </div>
    </div>
  );
}

function setSelectedObjectId(id: string | null) {
  useEditorStore.getState().setSelectedObjectId(id);
}
