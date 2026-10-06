import { useEditorStore } from "@/stores/editorStore";
import { hiddenZones, type HiddenZone } from "@/lib/safeZones";
import { cn } from "@/lib/utils";

const POSITION: Record<HiddenZone["edge"], (size: string) => React.CSSProperties> = {
  top: (size) => ({ top: 0, left: 0, right: 0, height: size }),
  bottom: (size) => ({ bottom: 0, left: 0, right: 0, height: size }),
  left: (size) => ({ top: 0, bottom: 0, left: 0, width: size }),
  right: (size) => ({ top: 0, bottom: 0, right: 0, width: size }),
};

/**
 * Repères posés au-dessus du canvas, dans le DOM : ils ne font pas partie de
 * la scène Fabric et ne peuvent donc jamais se retrouver dans l'export.
 */
export function SafeZoneOverlay() {
  const aspectRatio = useEditorStore((s) => s.aspectRatio);
  const network = useEditorStore((s) => s.previewNetwork);
  const imageLoaded = useEditorStore((s) => s.imageLoaded);
  const show = imageLoaded && network !== null;
  const zones = network ? hiddenZones(network, aspectRatio) : [];

  return (
    <div aria-hidden data-testid="safe-zones" data-network={network ?? "none"} className={cn("pointer-events-none absolute inset-0", !show && "hidden")}>
      {zones.map((zone) => (
        <div
          key={zone.edge}
          data-edge={zone.edge}
          className="absolute flex items-center justify-center border-dashed border-safelight/70 bg-[repeating-linear-gradient(135deg,hsl(var(--ink)/0.35)_0_6px,transparent_6px_12px)]"
          style={{
            ...POSITION[zone.edge](`${zone.size * 100}%`),
            [`border${zone.edge === "top" ? "Bottom" : zone.edge === "bottom" ? "Top" : zone.edge === "left" ? "Right" : "Left"}Width`]: 1,
          }}
        >
          {(zone.edge === "top" || zone.edge === "bottom") && (
            <span className="rounded bg-ink/80 px-2 py-0.5 text-2xs text-paper/90">{zone.label}</span>
          )}
        </div>
      ))}
    </div>
  );
}
