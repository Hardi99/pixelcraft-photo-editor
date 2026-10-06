import { useEffect, useRef, useCallback } from "react";
import { fabric } from "fabric";
import { useDropzone } from "react-dropzone";
import { Upload, ImageIcon } from "lucide-react";
import { useEditorStore, CANVAS_SIZES, DEFAULT_ADJUSTMENTS } from "@/stores/editorStore";
import { restoreLayers, serializeLayers, snapshot } from "@/lib/layers";
import { buildFilters, isPngOrJpeg, loadBackground, readAsDataURL } from "@/lib/scene";
import { trackEdit } from "@/lib/tracking";
import type { ActiveTool, CanvasLayers } from "@/types";
import { toast } from "sonner";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MIN_DIMENSION = 50; // px

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  // Calques du canvas précédent, reposés après un changement de format
  const carriedLayersRef = useRef<CanvasLayers | null>(null);
  // Vrai dès que le canvas affiche une image (scène chargée ou upload)
  const sceneReadyRef = useRef(false);
  // Copy/paste clipboard
  const clipboardRef = useRef<fabric.Object | null>(null);

  const imageLoaded = useEditorStore((s) => s.imageLoaded);
  const activeTool = useEditorStore((s) => s.activeTool);
  const aspectRatio = useEditorStore((s) => s.aspectRatio);
  const sceneId = useEditorStore((s) => s.sceneId);

  const { w: canvasW, h: canvasH } = CANVAS_SIZES[aspectRatio];

  const getScale = useCallback(() => {
    if (!containerRef.current) return 1;
    const maxW = containerRef.current.clientWidth - 32;
    const maxH = containerRef.current.clientHeight - 32;
    return Math.min(maxW / canvasW, maxH / canvasH);
  }, [canvasW, canvasH]);

  // (Re)construit la scène : au montage, au changement de format, à l'ouverture d'un projet
  useEffect(() => {
    if (!canvasRef.current) return;

    const scale = getScale();
    const fc = new fabric.Canvas(canvasRef.current, {
      width: canvasW * scale,
      height: canvasH * scale,
      backgroundColor: "#18181b",
      preserveObjectStacking: true,
      selection: true,
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
          const record = () => {
            sceneReadyRef.current = true;
            pushHistory(snapshot(fc));
          };
          if (layers) restoreLayers(fc, layers, record);
          else record();
        })
        .catch(() => toast.error("Impossible de charger l'image du projet."));
    }

    // Track selected object
    fc.on("selection:created", (e) => {
      setSelectedObjectId(e.selected?.[0]?.data?.id ?? null);
    });
    fc.on("selection:updated", (e) => {
      setSelectedObjectId(e.selected?.[0]?.data?.id ?? null);
    });
    fc.on("selection:cleared", () => setSelectedObjectId(null));

    // Auto-save history on modification
    fc.on("object:modified", () => pushHistory(snapshot(fc)));

    // Keyboard shortcuts
    const onKey = (e: KeyboardEvent) => {
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName ?? "");
      const active = fc.getActiveObject();
      const isEditingText = active?.type === "i-text" && (active as fabric.IText).isEditing;
      if (typing || isEditingText) return;

      const mod = e.ctrlKey || e.metaKey;
      if ((e.key === "Delete" || e.key === "Backspace") && active) {
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
      } else if (mod && e.key === "c" && active) {
        active.clone((cloned: fabric.Object) => { clipboardRef.current = cloned; });
      } else if (mod && e.key === "v" && clipboardRef.current) {
        clipboardRef.current.clone((cloned: fabric.Object) => {
          cloned.set({
            left: (cloned.left ?? 0) + 20,
            top: (cloned.top ?? 0) + 20,
            data: { id: crypto.randomUUID() },
          });
          fc.add(cloned);
          fc.setActiveObject(cloned);
          fc.renderAll();
          pushHistory(snapshot(fc));
        });
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
      fc.dispose();
    };
    // getScale dépend du format : la scène est reconstruite uniquement sur ces deux signaux
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspectRatio, sceneId]);

  // Sync cursor with active tool
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    fc.defaultCursor = activeTool === "text" ? "text" : "default";
    fc.hoverCursor = activeTool === "text" ? "text" : "pointer";
    fc.selection = activeTool === "select";

    const handleCanvasClick = (opt: fabric.IEvent) => {
      if (activeTool !== "text") return;
      const pointer = fc.getPointer(opt.e as MouseEvent);
      const itext = new fabric.IText("Votre texte", {
        left: pointer.x,
        top: pointer.y,
        fontSize: 36,
        fill: "#ffffff",
        fontFamily: "Arial",
        fontWeight: "bold",
        shadow: new fabric.Shadow({ color: "rgba(0,0,0,0.6)", blur: 8, offsetX: 2, offsetY: 2 }),
        data: { id: crypto.randomUUID() },
      });
      fc.add(itext);
      fc.setActiveObject(itext);
      itext.enterEditing();
      itext.selectAll();
      fc.renderAll();
      useEditorStore.getState().pushHistory(snapshot(fc));
      trackEdit("text");
      useEditorStore.getState().setActiveTool("select");
    };

    fc.on("mouse:down", handleCanvasClick);
    return () => { fc.off("mouse:down", handleCanvasClick); };
  }, [activeTool, sceneId, aspectRatio]);

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
          fc.setBackgroundImage(null as unknown as fabric.Image, fc.renderAll.bind(fc));
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
      className="relative flex min-w-0 flex-1 items-center justify-center overflow-hidden bg-stage"
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

      <div className={!imageLoaded ? "pointer-events-none opacity-0" : "shadow-[0_12px_40px_-8px_rgba(0,0,0,0.55)]"}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

function setSelectedObjectId(id: string | null) {
  useEditorStore.getState().setSelectedObjectId(id);
}
