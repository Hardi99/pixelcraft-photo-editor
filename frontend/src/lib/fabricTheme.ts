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

/** Flèche courbe à double pointe, contour sombre pour rester visible sur toute photo. */
function rotateCursor(degrees: number) {
  // 18 px affichés (dessin en 24 unités) : la taille des curseurs système à 100 %
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
    <g transform="rotate(${degrees} 12 12)" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <g stroke="#141516" stroke-width="4.5"><path d="M6 15 A8 8 0 0 1 15 6"/><path d="M12.5 3.5 15 6 12.5 8.5"/><path d="M3.5 12.5 6 15 8.5 12.5"/></g>
      <g stroke="#ffffff" stroke-width="2"><path d="M6 15 A8 8 0 0 1 15 6"/><path d="M12.5 3.5 15 6 12.5 8.5"/><path d="M3.5 12.5 6 15 8.5 12.5"/></g>
    </g>
  </svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 9 9, crosshair`;
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

  // Les poignées d'angle sont déclarées en premier : là où les zones se chevauchent,
  // Fabric retient la première trouvée, donc le redimensionnement prime sur la rotation.
  // Chaque objet reçoit son propre jeu (createControls est appelé à la construction).
  InteractiveFabricObject.createControls = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { mtr, mt, mb, ml, mr, ...corners } = controlsUtils.createObjectDefaultControls();
    return {
      controls: {
        ...corners,
        rotateTl: rotateZone(-0.5, -0.5, 0),
        rotateTr: rotateZone(0.5, -0.5, 90),
        rotateBr: rotateZone(0.5, 0.5, 180),
        rotateBl: rotateZone(-0.5, 0.5, 270),
      },
    };
  };
}
