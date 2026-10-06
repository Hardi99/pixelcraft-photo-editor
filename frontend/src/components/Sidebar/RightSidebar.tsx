import { useActiveObject } from "@/hooks/useActiveObject";
import { ObjectPanel } from "@/components/Sidebar/ObjectPanel";
import { useEditorStore, DEFAULT_ADJUSTMENTS } from "@/stores/editorStore";
import { useCanvas } from "@/hooks/useCanvas";
import { Slider } from "@/components/ui/slider";
import type { ImageAdjustments } from "@/types";

const ADJUSTMENTS: { label: string; key: keyof ImageAdjustments; min: number }[] = [
  { label: "Luminosité", key: "brightness", min: -1 },
  { label: "Contraste", key: "contrast", min: -1 },
  { label: "Saturation", key: "saturation", min: -1 },
  { label: "Flou", key: "blur", min: 0 },
];

const SHORTCUTS = [
  ["V", "Sélection"],
  ["T", "Texte"],
  ["S", "Stickers"],
  ["R", "Format"],
  ["Suppr", "Supprimer l'élément"],
  ["Ctrl Z", "Annuler"],
  ["Ctrl Y", "Rétablir"],
  ["Ctrl C / V", "Copier, coller"],
  ["Ctrl D", "Dupliquer"],
];

function formatValue(value: number) {
  const n = Math.round(value * 100);
  return n > 0 ? `+${n}` : String(n);
}

export function RightSidebar() {
  const adjustments = useEditorStore((s) => s.adjustments);
  const imageLoaded = useEditorStore((s) => s.imageLoaded);
  const selected = useActiveObject();
  const { applyAdjustment } = useCanvas();
  const touched = ADJUSTMENTS.some(({ key }) => adjustments[key] !== 0);

  return (
    <aside aria-label="Réglages" className="flex h-full w-72 flex-col overflow-y-auto border-l border-line bg-panel">
      {imageLoaded && selected ? (
        <ObjectPanel obj={selected} />
      ) : imageLoaded ? (
        <>
          <section className="border-b border-line p-4">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold">Réglages</h2>
              {touched && (
                <button
                  className="text-xs text-dim underline-offset-2 hover:text-paper hover:underline"
                  onClick={() => ADJUSTMENTS.forEach(({ key }) => applyAdjustment(key, DEFAULT_ADJUSTMENTS[key]))}
                >
                  Réinitialiser
                </button>
              )}
            </div>
            <div className="flex flex-col gap-5">
              {ADJUSTMENTS.map(({ label, key, min }) => (
                <div key={key}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span id={`adj-${key}`} className="text-paper/80">{label}</span>
                    <span className={`tabular-nums ${adjustments[key] !== 0 ? "text-safelight" : "text-dim"}`}>
                      {formatValue(adjustments[key])}
                    </span>
                  </div>
                  <Slider
                    aria-labelledby={`adj-${key}`}
                    centered={min < 0}
                    min={min}
                    max={1}
                    step={0.01}
                    value={[adjustments[key]]}
                    onValueChange={([v]) => applyAdjustment(key, v)}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="border-b border-line p-4">
            <h2 className="mb-1 text-sm font-semibold">Textes et stickers</h2>
            <p className="text-sm text-dim">Sélectionnez un élément pour régler ses effets et sa position.</p>
          </section>
        </>
      ) : (
        <section className="border-b border-line p-4">
          <h2 className="mb-1 text-sm font-semibold">Réglages</h2>
          <p className="text-sm text-dim">Ils apparaissent dès qu'une photo est chargée.</p>
        </section>
      )}

      <section className="mt-auto p-4">
        <h2 className="mb-3 text-sm font-semibold">Raccourcis clavier</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
          {SHORTCUTS.map(([key, label]) => (
            <div key={key} className="contents">
              <dt>
                <kbd className="rounded border border-line px-1.5 py-0.5 font-sans text-2xs text-paper/80">{key}</kbd>
              </dt>
              <dd className="self-center text-dim">{label}</dd>
            </div>
          ))}
        </dl>
      </section>
    </aside>
  );
}
