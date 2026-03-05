import { useEditorStore } from "@/stores/editorStore";
import { useCanvas } from "@/hooks/useCanvas";
import { Slider } from "@/components/ui/slider";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdjustRow {
  label: string;
  key: "brightness" | "contrast" | "saturation" | "blur";
  min: number;
  max: number;
  step: number;
}

const ADJUSTMENTS: AdjustRow[] = [
  { label: "Luminosité", key: "brightness", min: -1, max: 1, step: 0.01 },
  { label: "Contraste", key: "contrast", min: -1, max: 1, step: 0.01 },
  { label: "Saturation", key: "saturation", min: -1, max: 1, step: 0.01 },
  { label: "Flou", key: "blur", min: 0, max: 1, step: 0.01 },
];

export function RightSidebar() {
  const { adjustments, imageLoaded } = useEditorStore();
  const { applyAdjustment, deleteSelected } = useCanvas();

  if (!imageLoaded) {
    return (
      <aside className="flex w-64 flex-col gap-6 border-l border-zinc-800 bg-zinc-950 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Comment démarrer
        </h3>
        <ol className="space-y-4">
          {[
            { step: "1", label: "Choisir un ratio", sub: "1:1, 4:5, 16:9..." },
            { step: "2", label: "Uploader une photo", sub: "Glisser-déposer ou clic" },
            { step: "3", label: "Ajouter du texte", sub: "Outil T ou touche T" },
            { step: "4", label: "Appliquer un filtre", sub: "Barre en bas" },
            { step: "5", label: "Exporter en PNG", sub: "Bouton en haut à droite" },
          ].map(({ step, label, sub }) => (
            <li key={step} className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                {step}
              </span>
              <div>
                <p className="text-xs font-medium text-zinc-300">{label}</p>
                <p className="text-xs text-zinc-600">{sub}</p>
              </div>
            </li>
          ))}
        </ol>
      </aside>
    );
  }

  return (
    <aside className="flex w-64 flex-col gap-4 border-l border-zinc-800 bg-zinc-950 p-4 overflow-y-auto">
      {/* Image adjustments */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Réglages image
        </h3>
        <div className="flex flex-col gap-4">
          {ADJUSTMENTS.map(({ label, key, min, max, step }) => (
            <div key={key}>
              <div className="mb-1.5 flex justify-between">
                <span className="text-xs text-zinc-400">{label}</span>
                <span className="text-xs tabular-nums text-zinc-500">
                  {adjustments[key].toFixed(2)}
                </span>
              </div>
              <Slider
                min={min}
                max={max}
                step={step}
                value={[adjustments[key]]}
                onValueChange={([v]) => applyAdjustment(key, v)}
              />
            </div>
          ))}
        </div>
      </section>

      <div className="h-px bg-zinc-800" />

      {/* Selected object actions */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Objet sélectionné
        </h3>
        <Button
          variant="outline"
          size="sm"
          className="w-full border-zinc-700 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={deleteSelected}
        >
          <Trash2 className="h-4 w-4" />
          Supprimer
        </Button>
      </section>

      <div className="h-px bg-zinc-800" />

      {/* Quick tips */}
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Raccourcis
        </h3>
        <ul className="space-y-1 text-xs text-zinc-500">
          {[
            ["V", "Sélection"],
            ["T", "Texte"],
            ["S", "Sticker"],
            ["R", "Ratio"],
            ["Del", "Supprimer"],
            ["Ctrl+Z", "Annuler"],
            ["Ctrl+Y", "Rétablir"],
          ].map(([key, label]) => (
            <li key={key} className="flex justify-between">
              <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono">{key}</kbd>
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
