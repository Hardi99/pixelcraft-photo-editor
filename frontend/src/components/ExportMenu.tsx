import { useEffect, useRef, useState } from "react";
import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/stores/editorStore";
import { useCanvas } from "@/hooks/useCanvas";
import { EXPORT_FORMATS, EXPORT_TARGETS, type ExportFormat } from "@/lib/exportPresets";
import { cn } from "@/lib/utils";

// Le partage natif de fichiers existe surtout sur mobile (et Windows / macOS récents).
const canShareFiles = (() => {
  try {
    return !!navigator.canShare?.({ files: [new File([""], "test.png", { type: "image/png" })] });
  } catch {
    return false;
  }
})();

export function ExportMenu() {
  const imageLoaded = useEditorStore((s) => s.imageLoaded);
  const aspectRatio = useEditorStore((s) => s.aspectRatio);
  const { exportImage } = useCanvas();
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("jpeg");
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const target = EXPORT_TARGETS[aspectRatio];

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function run(mode: "download" | "share") {
    setBusy(true);
    await exportImage(format, mode);
    setBusy(false);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <Button
        size="sm"
        aria-label="Exporter"
        aria-expanded={open}
        aria-haspopup="dialog"
        disabled={!imageLoaded}
        onClick={() => setOpen((o) => !o)}
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">Exporter</span>
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label="Exporter pour les réseaux sociaux"
          className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-1rem)] rounded-lg border border-line bg-panel p-4 shadow-2xl"
        >
          <p className="text-sm font-semibold">{target.label}</p>
          <p className="mt-0.5 text-sm text-dim">{target.platforms}</p>
          <p className="mt-3 text-2xl font-extrabold tabular-nums tracking-tight">
            {target.width} × {target.height} <span className="text-sm font-medium text-dim">px</span>
          </p>

          <fieldset className="mt-4">
            <legend className="mb-2 text-xs font-medium text-dim">Type de fichier</legend>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(EXPORT_FORMATS) as ExportFormat[]).map((key) => (
                <label
                  key={key}
                  className={cn(
                    "cursor-pointer rounded-md border p-2.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-safelight",
                    format === key ? "border-safelight" : "border-line hover:border-paper/30"
                  )}
                >
                  <input
                    type="radio"
                    name="export-format"
                    value={key}
                    checked={format === key}
                    onChange={() => setFormat(key)}
                    className="sr-only"
                  />
                  <span className="block text-sm font-semibold">{EXPORT_FORMATS[key].label}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-dim">{EXPORT_FORMATS[key].hint}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-4 flex gap-2">
            <Button className="flex-1" disabled={busy} onClick={() => run("download")}>
              <Download className="h-4 w-4" />
              Télécharger
            </Button>
            {canShareFiles && (
              <Button variant="outline" className="flex-1" disabled={busy} onClick={() => run("share")}>
                <Share2 className="h-4 w-4" />
                Partager
              </Button>
            )}
          </div>

          <p className="mt-3 text-xs text-dim">
            Pour un autre réseau, changez le format de la publication avec l'outil Format.
          </p>
        </div>
      )}
    </div>
  );
}
