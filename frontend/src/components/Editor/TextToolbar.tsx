import { useEffect, useState } from "react";
import { fabric } from "fabric";
import { AlignLeft, AlignCenter, AlignRight, Bold, Italic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useEditorStore } from "@/stores/editorStore";
import { snapshot } from "@/lib/layers";

const FONTS = ["Arial", "Georgia", "Times New Roman", "Courier New", "Verdana", "Impact", "Trebuchet MS"];

interface TextProps {
  fontFamily: string;
  fontSize: number;
  fill: string;
  opacity: number;
  textAlign: string;
  fontWeight: string;
  fontStyle: string;
}

const DEFAULT_PROPS: TextProps = {
  fontFamily: "Arial",
  fontSize: 36,
  fill: "#ffffff",
  opacity: 1,
  textAlign: "left",
  fontWeight: "normal",
  fontStyle: "normal",
};

export function TextToolbar() {
  const canvas = useEditorStore((s) => s.canvas);
  const selectedObjectId = useEditorStore((s) => s.selectedObjectId);
  const pushHistory = useEditorStore((s) => s.pushHistory);
  const [props, setProps] = useState<TextProps>(DEFAULT_PROPS);

  // Read selected object props
  useEffect(() => {
    if (!canvas) return;
    const obj = canvas.getActiveObject() as fabric.IText | null;
    if (!obj || !(obj instanceof fabric.IText)) return;
    setProps({
      fontFamily: obj.fontFamily || "Arial",
      fontSize: obj.fontSize || 36,
      fill: String(obj.fill) || "#ffffff",
      opacity: (obj.opacity ?? 1),
      textAlign: obj.textAlign || "left",
      fontWeight: String(obj.fontWeight || "normal"),
      fontStyle: String(obj.fontStyle || "normal"),
    });
  }, [canvas, selectedObjectId]);

  function applyProp(key: keyof TextProps, value: string | number) {
    const obj = canvas?.getActiveObject() as fabric.IText | null;
    if (!obj || !(obj instanceof fabric.IText)) return;
    obj.set({ [key]: value } as Partial<fabric.IText>);
    canvas?.renderAll();
    setProps((p) => ({ ...p, [key]: value }));
    if (canvas) pushHistory(snapshot(canvas));
  }

  const activeObj = canvas?.getActiveObject();
  if (!activeObj || !(activeObj instanceof fabric.IText)) {
    return null;
  }

  return (
    <div
      role="toolbar"
      aria-label="Mise en forme du texte"
      // Flotte au-dessus de la photo : sélectionner un texte ne décale pas le canvas
      className="absolute inset-x-3 top-3 z-10 mx-auto flex w-fit flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-line bg-panel px-2.5 py-1.5 shadow-2xl"
    >
      {/* Font family */}
      <select
        value={props.fontFamily}
        onChange={(e) => applyProp("fontFamily", e.target.value)}
        aria-label="Police" className="h-8 rounded-md border border-line bg-ink px-2 text-xs text-paper"
      >
        {FONTS.map((f) => (
          <option key={f} value={f} style={{ fontFamily: f }}>
            {f}
          </option>
        ))}
      </select>

      {/* Font size */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-dim">Taille</span>
        <input
          type="number"
          min={8}
          max={200}
          value={props.fontSize}
          onChange={(e) => applyProp("fontSize", Number(e.target.value))}
          aria-label="Taille" className="h-8 w-14 rounded-md border border-line bg-ink px-2 text-xs tabular-nums text-paper"
        />
      </div>

      {/* Color */}
      <div className="flex items-center gap-2">
        <span className="sr-only">Couleur</span>
        <input
          type="color"
          value={props.fill}
          onChange={(e) => applyProp("fill", e.target.value)}
          aria-label="Couleur" className="h-7 w-7 cursor-pointer rounded border border-line bg-transparent p-0.5"
        />
      </div>

      {/* Opacity */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-dim">Opacité</span>
        <div className="w-20">
          <Slider
            aria-label="Opacité"
            min={0}
            max={1}
            step={0.01}
            value={[props.opacity]}
            onValueChange={([v]) => applyProp("opacity", v)}
          />
        </div>
        <span className="w-9 text-xs tabular-nums text-dim">{Math.round(props.opacity * 100)} %</span>
      </div>

      {/* Bold / Italic */}
      <Button
        size="icon"
        aria-label="Gras"
        aria-pressed={props.fontWeight === "bold"}
        variant={props.fontWeight === "bold" ? "secondary" : "ghost"}
        className="h-8 w-8"
        onClick={() => applyProp("fontWeight", props.fontWeight === "bold" ? "normal" : "bold")}
      >
        <Bold className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="icon"
        aria-label="Italique"
        aria-pressed={props.fontStyle === "italic"}
        variant={props.fontStyle === "italic" ? "secondary" : "ghost"}
        className="h-8 w-8"
        onClick={() => applyProp("fontStyle", props.fontStyle === "italic" ? "normal" : "italic")}
      >
        <Italic className="h-3.5 w-3.5" />
      </Button>

      {/* Text align */}
      {(["left", "center", "right"] as const).map((align) => {
        const Icon = align === "left" ? AlignLeft : align === "center" ? AlignCenter : AlignRight;
        return (
          <Button
            key={align}
            size="icon"
            aria-label={{ left: "Aligner à gauche", center: "Centrer", right: "Aligner à droite" }[align]}
            aria-pressed={props.textAlign === align}
            variant={props.textAlign === align ? "secondary" : "ghost"}
            className="h-8 w-8"
            onClick={() => applyProp("textAlign", align)}
          >
            <Icon className="h-3.5 w-3.5" />
          </Button>
        );
      })}
    </div>
  );
}
