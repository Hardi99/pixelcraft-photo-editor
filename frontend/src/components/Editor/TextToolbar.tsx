import { useEffect, useRef, useState } from "react";
import { AlignLeft, AlignCenter, AlignRight, Bold, Italic, ChevronDown, Minus, Plus, CaseUpper, Lock } from "lucide-react";
import { useActiveObject } from "@/hooks/useActiveObject";
import { useCanvas } from "@/hooks/useCanvas";
import { FONTS, isText } from "@/lib/text";
import { isLocked } from "@/lib/objects";
import { cn } from "@/lib/utils";

const SIZE_MIN = 8;
const SIZE_MAX = 400;

function IconToggle({ label, pressed, onClick, children }: { label: string; pressed?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
        pressed ? "bg-safelight/15 text-safelight" : "text-dim hover:bg-accent hover:text-paper"
      )}
    >
      {children}
    </button>
  );
}

/** Choix de police : chaque police est affichée dans sa propre fonte (US3-2). */
function FontPicker({ value, onChange }: { value: string; onChange: (family: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        aria-label="Police"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-40 items-center justify-between gap-2 rounded-md border border-line bg-ink px-2.5 text-sm text-paper hover:border-paper/30"
        style={{ fontFamily: `"${value}"` }}
      >
        <span className="truncate">{value}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-dim" />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Polices"
          className="absolute left-0 top-full z-50 mt-1.5 max-h-80 w-56 overflow-y-auto rounded-lg border border-line bg-panel p-1 shadow-2xl"
        >
          {FONTS.map(({ family, mood }, i) => (
            <li key={family}>
              {(i === 0 || FONTS[i - 1].mood !== mood) && (
                <p className="px-2.5 pb-1 pt-2 text-2xs text-dim">{mood}</p>
              )}
              <button
                role="option"
                aria-selected={family === value}
                onClick={() => {
                  onChange(family);
                  setOpen(false);
                }}
                className={cn(
                  "w-full rounded-md px-2.5 py-1.5 text-left text-base transition-colors hover:bg-accent",
                  family === value ? "text-safelight" : "text-paper"
                )}
                style={{ fontFamily: `"${family}"` }}
              >
                {family}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Barre de mise en forme du texte sélectionné. Elle flotte au-dessus de la photo
 * (une bande lui est réservée) ; les effets et la mise en page sont dans le panneau de droite.
 */
export function TextToolbar() {
  const obj = useActiveObject();
  const { updateText, uppercaseText } = useCanvas();

  if (!isText(obj)) return null;
  if (isLocked(obj)) {
    return (
      <div className="absolute inset-x-3 top-3 z-10 mx-auto flex w-fit items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2 text-sm text-dim shadow-2xl">
        <Lock className="h-4 w-4" />
        Texte verrouillé : déverrouillez-le dans le panneau de droite pour le modifier.
      </div>
    );
  }

  const fontSize = Math.round(obj.fontSize ?? 40);
  const setSize = (size: number) => void updateText({ fontSize: Math.min(SIZE_MAX, Math.max(SIZE_MIN, size)) });
  const bold = String(obj.fontWeight) === "bold" || Number(obj.fontWeight) >= 700;

  return (
    <div
      role="toolbar"
      aria-label="Mise en forme du texte"
      className="absolute inset-x-3 top-3 z-10 mx-auto flex w-fit flex-wrap items-center gap-x-2 gap-y-1.5 rounded-lg border border-line bg-panel px-2 py-1.5 shadow-2xl"
    >
      <FontPicker value={obj.fontFamily ?? "Poppins"} onChange={(fontFamily) => void updateText({ fontFamily })} />

      <div className="flex items-center rounded-md border border-line bg-ink">
        <button aria-label="Réduire la taille" onClick={() => setSize(fontSize - 2)} className="flex h-8 w-7 items-center justify-center text-dim hover:text-paper">
          <Minus className="h-3.5 w-3.5" />
        </button>
        <input
          aria-label="Taille"
          type="number"
          min={SIZE_MIN}
          max={SIZE_MAX}
          value={fontSize}
          onChange={(e) => setSize(Number(e.target.value))}
          className="h-8 w-11 bg-transparent text-center text-sm tabular-nums text-paper [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button aria-label="Augmenter la taille" onClick={() => setSize(fontSize + 2)} className="flex h-8 w-7 items-center justify-center text-dim hover:text-paper">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <label className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-md hover:bg-accent" title="Couleur du texte">
        <span className="sr-only">Couleur du texte</span>
        <span className="h-5 w-5 rounded-full border border-paper/30" style={{ background: String(obj.fill) }} />
        <input
          type="color"
          aria-label="Couleur du texte"
          value={String(obj.fill)}
          onChange={(e) => void updateText({ fill: e.target.value })}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>

      <div className="mx-0.5 h-5 w-px bg-line" />

      <IconToggle label="Gras" pressed={bold} onClick={() => void updateText({ fontWeight: bold ? "400" : "700" })}>
        <Bold className="h-4 w-4" />
      </IconToggle>
      <IconToggle label="Italique" pressed={obj.fontStyle === "italic"} onClick={() => void updateText({ fontStyle: obj.fontStyle === "italic" ? "normal" : "italic" })}>
        <Italic className="h-4 w-4" />
      </IconToggle>
      <IconToggle label="Majuscules" onClick={uppercaseText}>
        <CaseUpper className="h-4 w-4" />
      </IconToggle>

      <div className="mx-0.5 h-5 w-px bg-line" />

      {([
        ["left", "Aligner à gauche", AlignLeft],
        ["center", "Centrer", AlignCenter],
        ["right", "Aligner à droite", AlignRight],
      ] as const).map(([align, label, Icon]) => (
        <IconToggle key={align} label={label} pressed={obj.textAlign === align} onClick={() => void updateText({ textAlign: align })}>
          <Icon className="h-4 w-4" />
        </IconToggle>
      ))}
    </div>
  );
}
