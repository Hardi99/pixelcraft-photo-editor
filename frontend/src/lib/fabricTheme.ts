import { Control, InteractiveFabricObject, controlsUtils, type TPointerEvent, type TransformActionHandler } from "fabric";

/**
 * Apparence et poignées des éléments (US8-6, US8-7), réglées une fois pour tous
 * les textes et stickers (Fabric 7 : valeurs par défaut via ownDefaults et
 * createControls, plus de modification du prototype) :
 * - 4 poignées d'angle seulement : elles redimensionnent en gardant les
 *   proportions ; les poignées de côté étiraient le texte dans un seul sens ;
 * - pas de poignée de rotation : on tourne en saisissant l'élément juste à
 *   l'extérieur d'un coin, comme dans Figma, avec un curseur de rotation.
 */
let applied = false;

/**
 * Flèche courbe à double pointe, dessinée comme les curseurs système (corps blanc,
 * contour noir fin). Le tracé remplit son cadre (≈ 18 px dans une image de 24 px),
 * comme la main de saisie. Déclarée en 2x via image-set : comme les curseurs
 * système, elle grandit avec le zoom de l'écran (125 %, 150 %…).
 */
const CURSOR_SIZE = 24;

function rotateCursor(degrees: number) {
  // Arc du coin bas-gauche au coin haut-droit, bombé vers l'extérieur, et deux pointes
  const arrow = `<path d="M5 18 A13 13 0 0 1 18 5"/><path d="M14 2.5 18 5 14.5 9"/><path d="M2.5 14 5 18 9 14.5"/>`;
  const svg = (px: number) => `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 24 24">
    <g transform="rotate(${degrees} 12 12)" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <g stroke="#000000" stroke-width="3.4">${arrow}</g>
      <g stroke="#ffffff" stroke-width="1.5">${arrow}</g>
    </g>
  </svg>`;
  const url = (px: number) => `url("data:image/svg+xml,${encodeURIComponent(svg(px))}")`;
  const hotspot = CURSOR_SIZE / 2;
  return `-webkit-image-set(${url(CURSOR_SIZE)} 1x, ${url(CURSOR_SIZE * 2)} 2x) ${hotspot} ${hotspot}, ${url(CURSOR_SIZE)} ${hotspot} ${hotspot}, crosshair`;
}

/**
 * Flèche de redimensionnement diagonale selon le coin et la rotation de l'élément.
 * (Le choix automatique de Fabric renvoyait une flèche horizontale sur nos coins.)
 */
const RESIZE_CURSORS = ["ew-resize", "nwse-resize", "ns-resize", "nesw-resize"];

function diagonalCursor(control: Control, angle: number) {
  const direction = (Math.atan2(control.y, control.x) * 180) / Math.PI + angle;
  const index = Math.round((((direction % 180) + 180) % 180) / 45) % 4;
  return RESIZE_CURSORS[index];
}

// Pas de rotation quand on maintient Maj ou Alt Gr (US8-8)
const STRAIGHTEN_STEP = 15;

/** Maj, ou Alt Gr (que Windows transmet aussi comme Ctrl + Alt). */
function isStraightenKey(e: TPointerEvent) {
  return e.shiftKey || ("getModifierState" in e && e.getModifierState("AltGraph")) || (e.ctrlKey && e.altKey);
}

/**
 * Rotation de Fabric, avec un pas forcé de 15° tant que Maj ou Alt Gr est maintenu.
 * Fabric retient le palier inférieur dès qu'il est sous le seuil : un seuil d'un
 * demi-pas donne donc toujours le palier le plus proche (57° → 60°, pas 45°).
 */
const rotateWithStraighten: TransformActionHandler = (eventData, transform, x, y) => {
  if (!isStraightenKey(eventData)) return controlsUtils.rotationWithSnapping(eventData, transform, x, y);
  const target = transform.target;
  const { snapAngle, snapThreshold } = target;
  target.snapAngle = STRAIGHTEN_STEP;
  target.snapThreshold = STRAIGHTEN_STEP / 2 + 0.001;
  try {
    return controlsUtils.rotationWithSnapping(eventData, transform, x, y);
  } finally {
    target.snapAngle = snapAngle;
    target.snapThreshold = snapThreshold;
  }
};

// Distance (pixels écran) entre le coin et le centre de la zone de rotation, et taille de la zone
const ROTATE_OFFSET = 14;
const ROTATE_ZONE = 22;

function rotateZone(x: number, y: number, degrees: number) {
  return new Control({
    x,
    y,
    offsetX: Math.sign(x) * ROTATE_OFFSET,
    offsetY: Math.sign(y) * ROTATE_OFFSET,
    sizeX: ROTATE_ZONE,
    sizeY: ROTATE_ZONE,
    actionName: "rotate",
    actionHandler: rotateWithStraighten,
    cursorStyleHandler: () => rotateCursor(degrees),
    render: () => {}, // zone invisible : seul le curseur la signale
  });
}

export function applyFabricTheme() {
  if (applied) return;
  applied = true;

  InteractiveFabricObject.ownDefaults = {
    ...InteractiveFabricObject.ownDefaults,
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
  };

  // Fabric 7 teste les poignées de la dernière déclarée à la première : les coins sont
  // donc déclarés après les zones de rotation, pour que le redimensionnement l'emporte
  // là où elles se chevauchent. Chaque objet reçoit son propre jeu (createControls).
  InteractiveFabricObject.createControls = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { mtr, mt, mb, ml, mr, ...corners } = controlsUtils.createObjectDefaultControls();
    for (const corner of Object.values(corners)) {
      corner.cursorStyleHandler = (_e, control, object) => diagonalCursor(control, object.angle);
    }
    return {
      controls: {
        rotateTl: rotateZone(-0.5, -0.5, 0),
        rotateTr: rotateZone(0.5, -0.5, 90),
        rotateBr: rotateZone(0.5, 0.5, 180),
        rotateBl: rotateZone(-0.5, 0.5, 270),
        ...corners,
      },
    };
  };
}
