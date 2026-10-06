import { fabric } from "fabric";

/**
 * Apparence et poignées des éléments, à la manière de Canva (US8-6), réglées une
 * fois sur le prototype pour tous les textes et stickers :
 * - 4 poignées d'angle seulement : elles redimensionnent en gardant les
 *   proportions ; les poignées de côté étiraient le texte dans un seul sens ;
 * - poignée de rotation sous l'élément, loin du texte qu'on veut saisir.
 */
let applied = false;

export function applyFabricTheme() {
  if (applied) return;
  applied = true;

  fabric.Object.prototype.set({
    transparentCorners: false,
    cornerStyle: "circle",
    cornerSize: 12,
    cornerColor: "#ffffff",
    cornerStrokeColor: "#F5A524",
    borderColor: "#F5A524",
    borderScaleFactor: 1.5,
    padding: 6,
  });
  fabric.Object.prototype.setControlsVisibility({ mt: false, mb: false, ml: false, mr: false });

  const rotate = fabric.Object.prototype.controls.mtr;
  rotate.y = 0.5;
  rotate.offsetY = 28;
  rotate.withConnection = false;
}
