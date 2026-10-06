import {
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  BringToFront,
  SendToBack,
  ArrowUp,
  ArrowDown,
  Copy,
  Lock,
  Unlock,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import type { FabricObject, IText, Shadow } from "fabric";
import { Slider } from "@/components/ui/slider";
import { useCanvas } from "@/hooks/useCanvas";
import { isText } from "@/lib/text";
import { isLocked } from "@/lib/objects";
import type { PageAlign } from "@/lib/snapping";
import { cn } from "@/lib/utils";

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="border-b border-line p-4">
      {title && <h2 className="mb-3 text-sm font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between py-1 text-sm text-paper/90"
    >
      {label}
      <span className={cn("relative h-5 w-9 rounded-full transition-colors", checked ? "bg-safelight" : "bg-line")}>
        <span className={cn("absolute left-0 top-0.5 h-4 w-4 rounded-full bg-paper transition-transform", checked ? "translate-x-[18px]" : "translate-x-0.5")} />
      </span>
    </button>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  return (
    <label className="flex items-center justify-between text-sm text-dim">
      {label}
      <span className="relative flex items-center gap-2">
        <span className="tabular-nums text-xs uppercase">{value}</span>
        <span className="h-6 w-6 rounded-md border border-paper/30" style={{ background: value }} />
        <input type="color" aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
      </span>
    </label>
  );
}

function SliderField({ label, value, min, max, step, format, onChange, onCommit }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
  onCommit: () => void;
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-dim">{label}</span>
        <span className="tabular-nums text-paper/80">{format ? format(value) : value}</span>
      </div>
      <Slider aria-label={label} min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} onValueCommit={onCommit} />
    </div>
  );
}

/** Les couleurs Fabric peuvent être en rgba() : le sélecteur natif n'accepte que #rrggbb. */
function toHex(color: unknown, fallback = "#000000") {
  return typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
}

function TextEffects({ text }: { text: IText }) {
  const { updateText, previewText, commitChange, setTextShadow } = useCanvas();
  const shadow = text.shadow as Shadow | undefined;
  const shadowValue = { color: toHex(shadow?.color), blur: shadow?.blur ?? 12, distance: shadow?.offsetY ?? 4 };
  const strokeOn = !!text.stroke && (text.strokeWidth ?? 0) > 0;

  return (
    <Section>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <Switch label="Contour" checked={strokeOn} onChange={(on) => void updateText(on ? { stroke: "#000000", strokeWidth: 4 } : { stroke: undefined, strokeWidth: 0 })} />
          {strokeOn && (
            <>
              <ColorField label="Couleur du contour" value={toHex(text.stroke)} onChange={(stroke) => void updateText({ stroke })} />
              <SliderField label="Épaisseur" value={text.strokeWidth ?? 4} min={1} max={20} step={0.5} onChange={(strokeWidth) => previewText({ strokeWidth })} onCommit={commitChange} />
            </>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Switch label="Ombre" checked={!!shadow} onChange={(on) => setTextShadow(on ? { color: "#000000", blur: 12, distance: 4 } : null)} />
          {shadow && (
            <>
              <ColorField label="Couleur de l'ombre" value={shadowValue.color} onChange={(color) => setTextShadow({ ...shadowValue, color })} />
              <SliderField label="Flou" value={shadowValue.blur} min={0} max={40} step={1} onChange={(blur) => setTextShadow({ ...shadowValue, blur }, { live: true })} onCommit={commitChange} />
              <SliderField label="Distance" value={shadowValue.distance} min={0} max={30} step={1} onChange={(distance) => setTextShadow({ ...shadowValue, distance }, { live: true })} onCommit={commitChange} />
            </>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Switch label="Surlignage" checked={!!text.textBackgroundColor} onChange={(on) => void updateText({ textBackgroundColor: on ? "#111111" : "" })} />
          {!!text.textBackgroundColor && (
            <ColorField label="Couleur du surlignage" value={toHex(text.textBackgroundColor, "#111111")} onChange={(textBackgroundColor) => void updateText({ textBackgroundColor })} />
          )}
        </div>

        <SliderField label="Espacement des lettres" value={text.charSpacing ?? 0} min={-100} max={600} step={10} onChange={(charSpacing) => previewText({ charSpacing })} onCommit={commitChange} />
        <SliderField label="Interligne" value={text.lineHeight ?? 1.16} min={0.7} max={2.5} step={0.05} format={(v) => v.toFixed(2)} onChange={(lineHeight) => previewText({ lineHeight })} onCommit={commitChange} />
        <SliderField label="Opacité" value={text.opacity ?? 1} min={0} max={1} step={0.01} format={(v) => `${Math.round(v * 100)} %`} onChange={(opacity) => previewText({ opacity })} onCommit={commitChange} />
      </div>
    </Section>
  );
}

function ToolButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 items-center justify-center rounded-md border border-line text-dim transition-colors hover:border-paper/30 hover:text-paper disabled:opacity-30"
    >
      {children}
    </button>
  );
}

const ALIGNS: [PageAlign, string, React.ElementType][] = [
  ["left", "Aligner à gauche de la page", AlignHorizontalJustifyStart],
  ["hcenter", "Centrer horizontalement", AlignHorizontalJustifyCenter],
  ["right", "Aligner à droite de la page", AlignHorizontalJustifyEnd],
  ["top", "Aligner en haut de la page", AlignVerticalJustifyStart],
  ["vcenter", "Centrer verticalement", AlignVerticalJustifyCenter],
  ["bottom", "Aligner en bas de la page", AlignVerticalJustifyEnd],
];

function Layout({ obj }: { obj: FabricObject }) {
  const { alignActive, arrangeActive, duplicateActive, toggleLockActive, deleteSelected } = useCanvas();
  const locked = isLocked(obj);

  return (
    <>
      <Section title="Position sur la page">
        <div className="grid grid-cols-3 gap-1.5">
          {ALIGNS.map(([where, label, Icon]) => (
            <ToolButton key={where} label={label} disabled={locked} onClick={() => alignActive(where)}>
              <Icon className="h-4 w-4" />
            </ToolButton>
          ))}
        </div>
      </Section>

      <Section title="Superposition">
        <div className="grid grid-cols-4 gap-1.5">
          <ToolButton label="Premier plan" onClick={() => arrangeActive("front")}><BringToFront className="h-4 w-4" /></ToolButton>
          <ToolButton label="Avancer" onClick={() => arrangeActive("forward")}><ArrowUp className="h-4 w-4" /></ToolButton>
          <ToolButton label="Reculer" onClick={() => arrangeActive("backward")}><ArrowDown className="h-4 w-4" /></ToolButton>
          <ToolButton label="Arrière-plan" onClick={() => arrangeActive("back")}><SendToBack className="h-4 w-4" /></ToolButton>
        </div>
      </Section>

      <Section title="Élément">
        <div className="grid grid-cols-3 gap-1.5">
          <ToolButton label="Dupliquer (Ctrl+D)" onClick={() => void duplicateActive()}><Copy className="h-4 w-4" /></ToolButton>
          <ToolButton label={locked ? "Déverrouiller" : "Verrouiller"} onClick={toggleLockActive}>
            {locked ? <Unlock className="h-4 w-4 text-safelight" /> : <Lock className="h-4 w-4" />}
          </ToolButton>
          <ToolButton label="Supprimer" disabled={locked} onClick={deleteSelected}><Trash2 className="h-4 w-4" /></ToolButton>
        </div>
        {locked && <p className="mt-2 text-xs text-dim">Verrouillé : ni déplacement, ni modification, ni suppression.</p>}
      </Section>
    </>
  );
}

/**
 * Panneau contextuel de l'élément sélectionné. Pour un texte, deux onglets
 * (comme Canva) : tout tient à l'écran sans faire défiler le panneau.
 */
export function ObjectPanel({ obj }: { obj: FabricObject }) {
  const [tab, setTab] = useState<"effects" | "position">("effects");
  const withEffects = isText(obj) && !isLocked(obj);
  const current = withEffects ? tab : "position";

  return (
    <>
      {withEffects && (
        <div role="tablist" aria-label="Réglages de l'élément" className="flex border-b border-line px-2 pt-2">
          {([["effects", "Effets"], ["position", "Position"]] as const).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={current === id}
              onClick={() => setTab(id)}
              className={cn(
                "relative px-3 pb-2.5 pt-1 text-sm transition-colors",
                current === id ? "text-paper after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-safelight" : "text-dim hover:text-paper"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {current === "effects" && isText(obj) ? <TextEffects text={obj} /> : <Layout obj={obj} />}
    </>
  );
}
