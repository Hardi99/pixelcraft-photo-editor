import { fabric } from "fabric";

/**
 * Apparence et poignées des éléments (US8-6, US8-7), réglées une fois sur le
 * prototype pour tous les textes et stickers :
 * - 4 poignées d'angle seulement : elles redimensionnent en gardant les
 *   proportions ; les poignées de côté étiraient le texte dans un seul sens ;
 * - pas de poignée de rotation : on tourne en saisissant l'élément juste à
 *   l'extérieur d'un coin, comme dans Figma, avec un curseur de rotation.
 */
let applied = false;

/** Flèche courbe à double pointe, contour sombre pour rester visible sur toute photo. */
function rotateCursor(degrees: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <g transform="rotate(${degrees} 12 12)" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <g stroke="#141516" stroke-width="4.5"><path d="M6 15 A8 8 0 0 1 15 6"/><path d="M12.5 3.5 15 6 12.5 8.5"/><path d="M3.5 12.5 6 15 8.5 12.5"/></g>
      <g stroke="#ffffff" stroke-width="2"><path d="M6 15 A8 8 0 0 1 15 6"/><path d="M12.5 3.5 15 6 12.5 8.5"/><path d="M3.5 12.5 6 15 8.5 12.5"/></g>
    </g>
  </svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 12 12, crosshair`;
}

// Distance (pixels écran) entre le coin et le centre de la zone de rotation, et taille de la zone
const ROTATE_OFFSET = 14;
const ROTATE_ZONE = 22;

type ControlsUtils = { rotationWithSnapping: fabric.Control["actionHandler"] };

function rotateZone(x: number, y: number, degrees: number) {
  const utils = (fabric as unknown as { controlsUtils: ControlsUtils }).controlsUtils;
  return new fabric.Control({
    x,
    y,
    offsetX: Math.sign(x) * ROTATE_OFFSET,
    offsetY: Math.sign(y) * ROTATE_OFFSET,
    sizeX: ROTATE_ZONE,
    sizeY: ROTATE_ZONE,
    actionName: "rotate",
    actionHandler: utils.rotationWithSnapping,
    cursorStyleHandler: () => rotateCursor(degrees),
    render: () => {}, // zone invisible : seul le curseur la signale
  });
}

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
    // Aimantation de la rotation : à moins de 5° d'un multiple de 45°, l'angle s'y cale
    snapAngle: 45,
    snapThreshold: 5,
  });

  // Les poignées d'angle sont déclarées en premier : là où les zones se chevauchent,
  // Fabric retient la première trouvée, donc le redimensionnement prime sur la rotation.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { mtr, ...controls } = fabric.Object.prototype.controls;
  fabric.Object.prototype.controls = {
    ...controls,
    rotateTl: rotateZone(-0.5, -0.5, 0),
    rotateTr: rotateZone(0.5, -0.5, 90),
    rotateBr: rotateZone(0.5, 0.5, 180),
    rotateBl: rotateZone(-0.5, 0.5, 270),
  };
  fabric.Object.prototype.setControlsVisibility({ mt: false, mb: false, ml: false, mr: false });
}
