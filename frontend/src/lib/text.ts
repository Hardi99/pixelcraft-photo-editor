import { IText, Shadow, cache, type Canvas, type FabricObject, type ITextProps } from "fabric";

/**
 * Polices proposées (Google Fonts, déclarées dans index.html). Le navigateur ne
 * télécharge un fichier de police qu'au moment où elle est utilisée.
 */
export const FONTS: { family: string; mood: string }[] = [
  { family: "Anton", mood: "Impact" },
  { family: "Bebas Neue", mood: "Impact" },
  { family: "Archivo Black", mood: "Impact" },
  { family: "Oswald", mood: "Impact" },
  { family: "Montserrat", mood: "Moderne" },
  { family: "Poppins", mood: "Moderne" },
  { family: "Space Grotesk", mood: "Moderne" },
  { family: "Syne", mood: "Moderne" },
  { family: "Playfair Display", mood: "Élégant" },
  { family: "DM Serif Display", mood: "Élégant" },
  { family: "Abril Fatface", mood: "Élégant" },
  { family: "Lora", mood: "Élégant" },
  { family: "Caveat", mood: "Manuscrit" },
  { family: "Pacifico", mood: "Manuscrit" },
  { family: "Permanent Marker", mood: "Manuscrit" },
];

export type TextPresetId = "title" | "subtitle" | "body";

export const TEXT_PRESETS: Record<TextPresetId, { label: string; text: string; options: Partial<ITextProps> }> = {
  title: {
    label: "Ajouter un titre",
    text: "VOTRE TITRE",
    options: { fontFamily: "Anton", fontSize: 110, fontWeight: "400", charSpacing: 20, lineHeight: 1 },
  },
  subtitle: {
    label: "Ajouter un sous-titre",
    text: "Votre sous-titre",
    options: { fontFamily: "Montserrat", fontSize: 54, fontWeight: "700", lineHeight: 1.1 },
  },
  body: {
    label: "Ajouter un corps de texte",
    text: "Votre texte ici",
    options: { fontFamily: "Poppins", fontSize: 34, fontWeight: "400", lineHeight: 1.3 },
  },
};

/** Style commun : blanc avec une ombre douce, lisible sur fond clair comme sombre. */
export const BASE_TEXT_STYLE: Partial<ITextProps> = {
  fill: "#ffffff",
  textAlign: "center",
  // Ancré au centre (défaut de Fabric 7) : en tapant, le texte s'élargit des deux côtés
  originX: "center",
  originY: "center",
  paintFirst: "stroke", // le contour passe derrière le remplissage, comme dans Canva
  strokeLineJoin: "round",
  shadow: new Shadow({ color: "rgba(0,0,0,0.45)", blur: 12, offsetX: 0, offsetY: 4 }),
};

export function ensureFontLoaded(family: string, weight: string | number = "400"): Promise<unknown> {
  if (!("fonts" in document)) return Promise.resolve();
  return document.fonts.load(`${weight} 48px "${family}"`).catch(() => undefined);
}

/**
 * Fabric mesure le texte au moment où il le dessine : si la police n'était pas
 * encore chargée, les dimensions sont fausses. On recharge et on remesure.
 */
export async function refreshTextFonts(canvas: Canvas) {
  const texts = canvas.getObjects().filter((o): o is IText => o instanceof IText);
  await Promise.all(texts.map((t) => ensureFontLoaded(t.fontFamily ?? "Poppins", t.fontWeight ?? "400")));
  for (const t of texts) {
    cache.clearFontCache(t.fontFamily);
    t.initDimensions();
    t.setCoords();
  }
  canvas.requestRenderAll();
}

export function isText(obj: FabricObject | null | undefined): obj is IText {
  return obj instanceof IText;
}
