import { useEffect, useRef, useCallback } from "react";
import { fabric } from "fabric";
import { useDropzone } from "react-dropzone";
import { Upload, ImageIcon } from "lucide-react";
import { useEditorStore, CANVAS_SIZES } from "@/stores/editorStore";
import type { ActiveTool } from "@/types";
import { api } from "@/lib/api";
import { toast } from "sonner";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MIN_DIMENSION = 50; // px

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  // Persists the original File across ratio changes
  const imageFileRef = useRef<File | null>(null);
  // Copy/paste clipboard
  const clipboardRef = useRef<fabric.Object | null>(null);

  const {
    setCanvas,
    setImageLoaded,
    imageLoaded,
    activeTool,
    aspectRatio,
    pushHistory,
    setSelectedObjectId,
    startEditingTimer,
  } = useEditorStore();

  const { w: canvasW, h: canvasH } = CANVAS_SIZES[aspectRatio];

  const getScale = useCallback(() => {
    if (!containerRef.current) return 1;
    const maxW = containerRef.current.clientWidth - 32;
    const maxH = containerRef.current.clientHeight - 32;
    return Math.min(maxW / canvasW, maxH / canvasH);
  }, [canvasW, canvasH]);

  // Apply an image file to a given fabric canvas instance
  const applyImage = useCallback(
    (fc: fabric.Canvas, file: File, cW: number, cH: number, onDone?: (w: number, h: number) => void) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target!.result as string;
        useEditorStore.getState().setImageUrl(dataUrl);
        fabric.Image.fromURL(dataUrl, (img) => {
          const imgScale = Math.max(cW / img.width!, cH / img.height!);
          img.set({
            scaleX: imgScale,
            scaleY: imgScale,
            left: (cW - img.width! * imgScale) / 2,
            top: (cH - img.height! * imgScale) / 2,
            selectable: false,
            evented: false,
          });
          fc.clear();
          fc.setBackgroundImage(img, fc.renderAll.bind(fc));
          onDone?.(img.width!, img.height!);
        });
      };
      reader.readAsDataURL(file);
    },
    []
  );

  // Init / re-init Fabric.js when aspect ratio changes
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
    setCanvas(fc);

    // Re-apply image if one was already loaded (ratio change)
    if (imageFileRef.current) {
      applyImage(fc, imageFileRef.current, canvasW, canvasH, () => {
        pushHistory(JSON.stringify(fc.toJSON(["data"])));
      });
    } else {
      const { imageUrl } = useEditorStore.getState();
      if (imageUrl) {
        fabric.Image.fromURL(imageUrl, (img) => {
          const imgScale = Math.max(canvasW / img.width!, canvasH / img.height!);
          img.set({
            scaleX: imgScale, scaleY: imgScale,
            left: (canvasW - img.width! * imgScale) / 2,
            top: (canvasH - img.height! * imgScale) / 2,
            selectable: false, evented: false,
          });
          fc.setBackgroundImage(img, fc.renderAll.bind(fc));
          pushHistory(JSON.stringify(fc.toJSON(["data"])));
        }, { crossOrigin: "anonymous" });
      }
    }

    // Track selected object
    fc.on("selection:created", (e) => {
      setSelectedObjectId(e.selected?.[0]?.data?.id ?? null);
    });
    fc.on("selection:cleared", () => setSelectedObjectId(null));

    // Auto-save history on modification
    fc.on("object:modified", () => {
      pushHistory(JSON.stringify(fc.toJSON(["data"])));
    });

    // Keyboard shortcuts
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && document.activeElement?.tagName !== "INPUT") {
        const active = fc.getActiveObject();
        // Don't delete the object if a text is currently being edited
        const isEditingText = active?.type === "i-text" && (active as fabric.IText).isEditing;
        if (active && !isEditingText) {
          fc.remove(active);
          fc.renderAll();
          pushHistory(JSON.stringify(fc.toJSON(["data"])));
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        useEditorStore.getState().undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "z"))) {
        e.preventDefault();
        useEditorStore.getState().redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        const active = fc.getActiveObject();
        if (active) active.clone((cloned: fabric.Object) => { clipboardRef.current = cloned; });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        const obj = clipboardRef.current;
        if (obj) {
          obj.clone((cloned: fabric.Object) => {
            cloned.set({
              left: (cloned.left ?? 0) + 20,
              top: (cloned.top ?? 0) + 20,
              data: { id: Date.now().toString() },
            });
            fc.add(cloned);
            fc.setActiveObject(cloned);
            fc.renderAll();
            pushHistory(JSON.stringify(fc.toJSON(["data"])));
          });
        }
      }
      if (document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        const toolMap: Record<string, ActiveTool> = { v: "select", t: "text", s: "sticker", r: "crop" };
        const tool = toolMap[e.key.toLowerCase()];
        if (tool) useEditorStore.getState().setActiveTool(tool);
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      fc.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspectRatio]);

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
        data: { id: Date.now().toString() },
      });
      fc.add(itext);
      fc.setActiveObject(itext);
      itext.enterEditing();
      itext.selectAll();
      fc.renderAll();
      pushHistory(JSON.stringify(fc.toJSON(["data"])));
      api.track("text");
      useEditorStore.getState().setActiveTool("select");
    };

    fc.on("mouse:down", handleCanvasClick);
    return () => { fc.off("mouse:down", handleCanvasClick); };
  }, [activeTool, pushHistory]);

  // Validate file before loading
  const validateAndLoad = useCallback(
    (file: File) => {
      const fc = fabricRef.current;
      if (!fc) return;

      if (file.size === 0) {
        toast.error("Fichier vide — impossible de charger l'image.");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`Fichier trop lourd (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum : 10 MB.`);
        return;
      }

      // Magic bytes check — verify actual file content matches declared type
      const reader = new FileReader();
      reader.onload = (e) => {
        const arr = new Uint8Array(e.target!.result as ArrayBuffer).subarray(0, 4);
        const header = Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
        const isJpeg = header.startsWith("ffd8ff");
        const isPng  = header === "89504e47";
        if (!isJpeg && !isPng) {
          toast.error("Format non supporté. Seuls PNG et JPG sont acceptés.");
          return;
        }

        imageFileRef.current = file;
        applyImage(fc, file, canvasW, canvasH, (w, h) => {
          if (w < MIN_DIMENSION || h < MIN_DIMENSION) {
            toast.error(`Image trop petite (${w}×${h}px). Minimum : ${MIN_DIMENSION}px.`);
            fc.clear();
            fc.setBackgroundColor("#18181b", fc.renderAll.bind(fc));
            imageFileRef.current = null;
            return;
          }
          setImageLoaded(true);
          startEditingTimer();
          pushHistory(JSON.stringify(fc.toJSON(["data"])));
          api.track("upload", { filename: file.name });
        });
      };
      reader.readAsArrayBuffer(file);
    },
    [canvasW, canvasH, applyImage, setImageLoaded, startEditingTimer, pushHistory]
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
      if (accepted[0]) validateAndLoad(accepted[0]);
    },
    noClick: imageLoaded,
    noDrag: imageLoaded,
  });

  return (
    <div
      ref={containerRef}
      className="relative flex flex-1 items-center justify-center overflow-hidden bg-zinc-900"
    >
      {!imageLoaded && (
        <div
          {...getRootProps()}
          style={{ zIndex: 20 }}
          className={`absolute inset-8 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
            isDragActive ? "border-primary bg-primary/10" : "border-zinc-700 hover:border-zinc-500"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4 text-zinc-400">
            <div className="rounded-full bg-zinc-800 p-4">
              {isDragActive ? (
                <ImageIcon className="h-8 w-8 text-primary" />
              ) : (
                <Upload className="h-8 w-8" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-200">
                {isDragActive ? "Déposez l'image ici" : "Glissez votre photo ici"}
              </p>
              <p className="mt-1 text-xs text-zinc-500">PNG, JPG · Cliquez pour parcourir</p>
            </div>
          </div>
        </div>
      )}

      <div className={!imageLoaded ? "pointer-events-none opacity-0" : ""}>
        <canvas ref={canvasRef} className="shadow-2xl" />
      </div>
    </div>
  );
}
