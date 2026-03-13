import { useEffect, useState } from "react";
import { fabric } from "fabric";
import { AlignLeft, AlignCenter, AlignRight, Bold, Italic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useEditorStore } from "@/stores/editorStore";

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
  const { canvas, selectedObjectId, pushHistory } = useEditorStore();
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
    pushHistory(JSON.stringify(canvas?.toJSON(["data"])));
  }

  const activeObj = canvas?.getActiveObject();
  if (!activeObj || !(activeObj instanceof fabric.IText)) {
    return <div className="h-12 shrink-0 border-b border-zinc-800 bg-zinc-900" />;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-zinc-800 bg-zinc-900 px-4 py-2 shrink-0">
      {/* Font family */}
      <select
        value={props.fontFamily}
        onChange={(e) => applyProp("fontFamily", e.target.value)}
        className="h-8 rounded bg-zinc-800 px-2 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {FONTS.map((f) => (
          <option key={f} value={f} style={{ fontFamily: f }}>
            {f}
          </option>
        ))}
      </select>

      {/* Font size */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500">Taille</span>
        <input
          type="number"
          min={8}
          max={200}
          value={props.fontSize}
          onChange={(e) => applyProp("fontSize", Number(e.target.value))}
          className="h-8 w-16 rounded bg-zinc-800 px-2 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Color */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500">Couleur</span>
        <input
          type="color"
          value={props.fill}
          onChange={(e) => applyProp("fill", e.target.value)}
          className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent p-0"
        />
      </div>

      {/* Opacity */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500">Opacité</span>
        <div className="w-24">
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={[props.opacity]}
            onValueChange={([v]) => applyProp("opacity", v)}
          />
        </div>
        <span className="w-8 text-xs text-zinc-400">{Math.round(props.opacity * 100)}%</span>
      </div>

      {/* Bold / Italic */}
      <Button
        size="icon"
        variant={props.fontWeight === "bold" ? "secondary" : "ghost"}
        className="h-8 w-8"
        onClick={() => applyProp("fontWeight", props.fontWeight === "bold" ? "normal" : "bold")}
      >
        <Bold className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="icon"
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
