import type { AspectRatio, PreviewNetwork } from "@/types";

/** Bande de l'image masquée ou rognée par Instagram, en fraction de la largeur ou de la hauteur. */
export interface HiddenZone {
  edge: "top" | "bottom" | "left" | "right";
  size: number;
  label: string;
}

// Story : interface d'Instagram au-dessus de l'image (nom du compte en haut ;
// légende, barre de réponse et musique en bas). Valeurs prudentes croisées
// entre plusieurs guides d'octobre 2026 (≈ 250 à 270 px en haut, jusqu'à 380 px en bas).
const STORY_TOP = 0.14;
const STORY_BOTTOM = 0.2;

// La grille du profil affiche chaque publication en 3:4, centrée.
const GRID_RATIO = 3 / 4;

const RATIO_VALUES: Record<AspectRatio, number> = { "1:1": 1, "4:5": 4 / 5, "3:4": 3 / 4, "9:16": 9 / 16, "16:9": 16 / 9 };

export function instagramHiddenZones(ratio: AspectRatio): HiddenZone[] {
  if (ratio === "9:16") {
    return [
      { edge: "top", size: STORY_TOP, label: "Masqué par le nom du compte" },
      { edge: "bottom", size: STORY_BOTTOM, label: "Masqué par la légende et la barre de réponse" },
    ];
  }

  const side = (1 - GRID_RATIO / RATIO_VALUES[ratio]) / 2;
  if (side <= 0.001) return [];
  return [
    { edge: "left", size: side, label: "Rogné dans la grille du profil" },
    { edge: "right", size: side, label: "Rogné dans la grille du profil" },
  ];
}

// X affiche une image seule recadrée en 16:9 dans le fil. Le cadrage réel est
// choisi par un algorithme (zone « intéressante ») : le repère est centré, indicatif.
const X_TIMELINE_RATIO = 16 / 9;

export function xHiddenZones(ratio: AspectRatio): HiddenZone[] {
  const r = RATIO_VALUES[ratio];
  const label = "Hors du cadrage 16:9 du fil X";
  if (Math.abs(r - X_TIMELINE_RATIO) < 0.001) return [];
  if (r < X_TIMELINE_RATIO) {
    const band = (1 - r / X_TIMELINE_RATIO) / 2;
    return [
      { edge: "top", size: band, label },
      { edge: "bottom", size: band, label },
    ];
  }
  const band = (1 - X_TIMELINE_RATIO / r) / 2;
  return [
    { edge: "left", size: band, label },
    { edge: "right", size: band, label },
  ];
}

export function hiddenZones(network: PreviewNetwork, ratio: AspectRatio): HiddenZone[] {
  return network === "x" ? xHiddenZones(ratio) : instagramHiddenZones(ratio);
}
