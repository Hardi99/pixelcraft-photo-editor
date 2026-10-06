import { useEffect, useState } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { useCanvas } from "@/hooks/useCanvas";
import { FILTER_PRESETS } from "@/lib/filters";
import { cn } from "@/lib/utils";

const FRAME_W = 80;
const FRAME_H = 60;

/** Réduit la photo une fois : chaque vue de la bande réutilise cette vignette. */
function usePreview(url: string | null) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return setPreview(null);
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const scale = Math.max((FRAME_W * 2) / img.width, (FRAME_H * 2) / img.height);
      const canvas = document.createElement("canvas");
      canvas.width = FRAME_W * 2;
      canvas.height = FRAME_H * 2;
      const w = img.width * scale;
      const h = img.height * scale;
      canvas.getContext("2d")?.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      if (!cancelled) setPreview(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.src = url;
    return () => { cancelled = true; };
  }, [url]);

  return preview;
}

/** Les filtres présentés comme une bande de film : chaque vue montre la photo filtrée. */
export function FilterPresets() {
  const selectedFilter = useEditorStore((s) => s.selectedFilter);
  const imageLoaded = useEditorStore((s) => s.imageLoaded);
  const preview = usePreview(useEditorStore((s) => s.imageUrl));
  const { applyInstagramFilter } = useCanvas();

  if (!imageLoaded) return null;

  return (
    <div className="shrink-0 overflow-x-auto border-t border-line bg-film">
      <div role="radiogroup" aria-label="Filtres" className="film-strip flex w-max gap-2.5 px-4 pb-5 pt-5">
        {FILTER_PRESETS.map((preset, index) => {
          const active = selectedFilter === preset.name;
          return (
            <button
              key={preset.name}
              role="radio"
              aria-checked={active}
              onClick={() => applyInstagramFilter(preset.name)}
              className="group flex flex-col items-center gap-1.5 rounded-sm focus-visible:ring-offset-film"
              style={{ width: FRAME_W }}
            >
              <span
                className={cn(
                  "block overflow-hidden rounded-[2px] bg-ink outline outline-2 outline-offset-2 transition-[outline-color]",
                  active ? "outline-safelight" : "outline-transparent group-hover:outline-paper/25"
                )}
                style={{ width: FRAME_W, height: FRAME_H }}
              >
                {preview && (
                  <img
                    src={preview}
                    alt=""
                    className="h-full w-full object-cover"
                    style={{ filter: preset.cssPreview || undefined }}
                  />
                )}
              </span>
              {/* Impression du bord de film : numéro de vue + nom du filtre */}
              <span
                className={cn(
                  "flex w-full items-baseline justify-center gap-1 text-2xs",
                  active ? "font-semibold text-safelight" : "text-edge-print/80 group-hover:text-edge-print"
                )}
              >
                <span className="tabular-nums opacity-70">{index + 1}</span>
                {preset.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
