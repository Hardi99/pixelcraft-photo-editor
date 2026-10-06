import { MousePointer2, Type, Smile, Crop, ImagePlus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useEditorStore } from "@/stores/editorStore";
import { useCanvas } from "@/hooks/useCanvas";
import { trackEdit } from "@/lib/tracking";
import { cn } from "@/lib/utils";
import type { ActiveTool, AspectRatio } from "@/types";

const TOOLS: { id: ActiveTool; icon: React.ElementType; label: string; shortcut: string }[] = [
  { id: "select", icon: MousePointer2, label: "Sélection", shortcut: "V" },
  { id: "text", icon: Type, label: "Texte", shortcut: "T" },
  { id: "sticker", icon: Smile, label: "Stickers", shortcut: "S" },
  { id: "crop", icon: Crop, label: "Format", shortcut: "R" },
];

const RATIOS: { id: AspectRatio; label: string; w: number; h: number }[] = [
  { id: "1:1", label: "Carré", w: 1, h: 1 },
  { id: "4:5", label: "Portrait", w: 4, h: 5 },
  { id: "16:9", label: "Paysage", w: 16, h: 9 },
  { id: "9:16", label: "Story", w: 9, h: 16 },
];

const STICKERS = ["😍", "🔥", "✨", "💯", "🎉", "❤️", "👑", "🌟", "🚀", "💎", "🎨", "📸"];

function Popover({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="absolute left-full top-2 z-30 ml-2 w-56 rounded-lg border border-line bg-panel p-3 shadow-2xl">
      <p className="mb-2 text-xs font-medium text-dim">{title}</p>
      {children}
    </div>
  );
}

export function LeftSidebar() {
  const activeTool = useEditorStore((s) => s.activeTool);
  const aspectRatio = useEditorStore((s) => s.aspectRatio);
  const imageLoaded = useEditorStore((s) => s.imageLoaded);
  const { setActiveTool, setAspectRatio } = useEditorStore.getState();
  const { addSticker } = useCanvas();

  function startOver() {
    const { canvas, resetEditor } = useEditorStore.getState();
    canvas?.remove(...canvas.getObjects());
    canvas?.setBackgroundImage(null, canvas.renderAll.bind(canvas));
    resetEditor();
  }

  return (
    <aside aria-label="Outils" className="relative z-20 flex w-14 shrink-0 flex-col items-center gap-1 border-r border-line bg-panel py-3">
      {TOOLS.map(({ id, icon: Icon, label, shortcut }) => {
        const active = activeTool === id;
        return (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <button
                aria-label={label}
                aria-pressed={active}
                disabled={!imageLoaded && id !== "crop"}
                onClick={() => setActiveTool(active && id !== "select" ? "select" : id)}
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-md transition-colors disabled:opacity-30",
                  active ? "bg-safelight/15 text-safelight" : "text-dim hover:bg-accent hover:text-paper"
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {label} · {shortcut}
            </TooltipContent>
          </Tooltip>
        );
      })}

      {activeTool === "sticker" && imageLoaded && (
        <Popover title="Ajouter un sticker">
          <div className="grid grid-cols-4 gap-1">
            {STICKERS.map((emoji) => (
              <button
                key={emoji}
                aria-label={`Ajouter ${emoji}`}
                onClick={() => { addSticker(emoji); setActiveTool("select"); }}
                className="rounded-md p-1.5 text-2xl transition-colors hover:bg-accent"
              >
                {emoji}
              </button>
            ))}
          </div>
        </Popover>
      )}

      {activeTool === "crop" && (
        <Popover title="Format de la publication">
          <div className="grid grid-cols-2 gap-1.5">
            {RATIOS.map(({ id, label, w, h }) => (
              <button
                key={id}
                aria-pressed={aspectRatio === id}
                onClick={() => {
                  if (id !== aspectRatio && imageLoaded) trackEdit("crop", { ratio: id });
                  setAspectRatio(id);
                  setActiveTool("select");
                }}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-md border px-2 pb-2 pt-3 transition-colors",
                  aspectRatio === id ? "border-safelight text-paper" : "border-line text-dim hover:border-paper/30 hover:text-paper"
                )}
              >
                {/* Aperçu du format à ses vraies proportions */}
                <span className="flex h-9 items-center">
                  <span
                    className={cn("block rounded-[2px] border-[1.5px]", aspectRatio === id ? "border-safelight" : "border-current")}
                    style={{ width: w >= h ? 36 : (36 * w) / h, height: h >= w ? 36 : (36 * h) / w }}
                  />
                </span>
                <span className="text-xs">
                  <span className="font-semibold tabular-nums">{id}</span> {label}
                </span>
              </button>
            ))}
          </div>
        </Popover>
      )}

      {imageLoaded && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              aria-label="Nouvelle photo"
              onClick={startOver}
              className="mt-auto flex h-10 w-10 items-center justify-center rounded-md text-dim transition-colors hover:bg-accent hover:text-paper"
            >
              <ImagePlus className="h-[18px] w-[18px]" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Nouvelle photo (le projet en cours est fermé)</TooltipContent>
        </Tooltip>
      )}
    </aside>
  );
}
