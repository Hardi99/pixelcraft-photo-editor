import { useEditorStore } from "@/stores/editorStore";
import { useCanvas } from "@/hooks/useCanvas";
import { FILTER_PRESETS } from "@/lib/filters";

export function FilterPresets() {
  const { selectedFilter, imageLoaded } = useEditorStore();
  const { applyInstagramFilter } = useCanvas();

  if (!imageLoaded) return null;

  return (
    <div className="flex h-24 shrink-0 items-center gap-3 overflow-x-auto border-t border-zinc-800 bg-zinc-950 px-4">
      {FILTER_PRESETS.map((preset) => (
        <button
          key={preset.name}
          onClick={() => applyInstagramFilter(preset.name)}
          className={`filter-thumb flex shrink-0 flex-col items-center gap-1 ${selectedFilter === preset.name ? "active" : ""}`}
        >
          <div
            className="h-14 w-14 rounded-md bg-gradient-to-br from-violet-500 via-pink-500 to-orange-400"
            style={{ filter: preset.cssPreview }}
          />
          <span className="text-[10px] text-zinc-400">{preset.label}</span>
        </button>
      ))}
    </div>
  );
}
