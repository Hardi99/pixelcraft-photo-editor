export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Snap {
  dx: number;
  dy: number;
  /** Lignes de guide à afficher (coordonnées de la page), une par axe au plus. */
  guideX: number | null;
  guideY: number | null;
}

/**
 * Aimante une boîte sur les lignes utiles de la page : bords et centre.
 * Pour chaque axe, on compare le bord gauche, le centre et le bord droit de la
 * boîte à ces lignes, et on retient la correction la plus petite sous le seuil.
 */
export function snapToPage(box: Box, page: { w: number; h: number }, threshold: number): Snap {
  const axis = (start: number, size: number, pageSize: number) => {
    const lines = [0, pageSize / 2, pageSize];
    const anchors = [start, start + size / 2, start + size];
    let best: { delta: number; line: number } | null = null;
    for (const line of lines) {
      for (const anchor of anchors) {
        const delta = line - anchor;
        if (Math.abs(delta) <= threshold && (!best || Math.abs(delta) < Math.abs(best.delta))) best = { delta, line };
      }
    }
    return best;
  };

  const x = axis(box.left, box.width, page.w);
  const y = axis(box.top, box.height, page.h);
  return { dx: x?.delta ?? 0, dy: y?.delta ?? 0, guideX: x?.line ?? null, guideY: y?.line ?? null };
}

export type PageAlign = "left" | "hcenter" | "right" | "top" | "vcenter" | "bottom";

/** Déplacement à appliquer pour aligner une boîte sur la page. */
export function alignOnPage(box: Box, page: { w: number; h: number }, where: PageAlign): { dx: number; dy: number } {
  switch (where) {
    case "left": return { dx: -box.left, dy: 0 };
    case "hcenter": return { dx: (page.w - box.width) / 2 - box.left, dy: 0 };
    case "right": return { dx: page.w - box.width - box.left, dy: 0 };
    case "top": return { dx: 0, dy: -box.top };
    case "vcenter": return { dx: 0, dy: (page.h - box.height) / 2 - box.top };
    case "bottom": return { dx: 0, dy: page.h - box.height - box.top };
  }
}
