import { MousePointer2, Type, Smile, Crop, RotateCcw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/stores/editorStore";
import { useCanvas } from "@/hooks/useCanvas";
import type { ActiveTool, AspectRatio } from "@/types";

const TOOLS: { id: ActiveTool; icon: React.ElementType; label: string; shortcut: string }[] = [
  { id: "select", icon: MousePointer2, label: "Sélection", shortcut: "V" },
  { id: "text", icon: Type, label: "Texte", shortcut: "T" },
  { id: "sticker", icon: Smile, label: "Sticker", shortcut: "S" },
  { id: "crop", icon: Crop, label: "Ratio", shortcut: "R" },
];

const RATIOS: AspectRatio[] = ["1:1", "4:5", "16:9", "9:16"];

const STICKERS = ["😍", "🔥", "✨", "💯", "🎉", "❤️", "👑", "🌟", "🚀", "💎", "🎨", "📸"];

export function LeftSidebar() {
  const { activeTool, setActiveTool, aspectRatio, setAspectRatio, imageLoaded } = useEditorStore();
  const { addSticker } = useCanvas();

  return (
    <aside className="flex w-16 flex-col items-center gap-1 border-r border-zinc-800 bg-zinc-950 py-3">
      {TOOLS.map(({ id, icon: Icon, label, shortcut }) => (
        <Tooltip key={id}>
          <TooltipTrigger asChild>
            <Button
              variant={activeTool === id ? "secondary" : "ghost"}
              size="icon"
              disabled={!imageLoaded && id !== "crop"}
              onClick={() => setActiveTool(id)}
              className="h-10 w-10"
            >
              <Icon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {label} <kbd className="ml-1 text-[10px] opacity-60">{shortcut}</kbd>
          </TooltipContent>
        </Tooltip>
      ))}

      <div className="my-2 h-px w-8 bg-zinc-800" />

      {/* Stickers panel — shown only when sticker tool active */}
      {activeTool === "sticker" && imageLoaded && (
        <div className="absolute left-16 top-14 z-30 w-52 rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-xl">
          <p className="mb-2 text-xs font-medium text-zinc-400">Stickers</p>
          <div className="grid grid-cols-4 gap-1">
            {STICKERS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => { addSticker(emoji); setActiveTool("select"); }}
                className="rounded p-1.5 text-2xl hover:bg-zinc-700 transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Ratio panel — shown only when crop tool active */}
      {activeTool === "crop" && (
        <div className="absolute left-16 top-14 z-30 w-40 rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-xl">
          <p className="mb-2 text-xs font-medium text-zinc-400">Format</p>
          <div className="flex flex-col gap-1">
            {RATIOS.map((r) => (
              <button
                key={r}
                onClick={() => { setAspectRatio(r); setActiveTool("select"); }}
                className={`rounded px-3 py-1.5 text-left text-xs transition-colors ${
                  aspectRatio === r
                    ? "bg-primary text-white"
                    : "text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                {r} {r === "1:1" ? "— Carré" : r === "4:5" ? "— Portrait" : r === "16:9" ? "— Paysage" : "— Story"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reset / clear */}
      {imageLoaded && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="mt-auto h-10 w-10 text-zinc-500 hover:text-destructive"
              onClick={() => {
                const { canvas, resetEditor } = useEditorStore.getState();
                canvas?.clear();
                canvas?.setBackgroundColor("#18181b", canvas.renderAll.bind(canvas));
                resetEditor();
              }}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Recommencer</TooltipContent>
        </Tooltip>
      )}
    </aside>
  );
}
