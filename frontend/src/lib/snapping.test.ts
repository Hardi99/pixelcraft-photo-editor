import { describe, it, expect } from "vitest";
import { alignOnPage, snapToPage } from "./snapping";

const page = { w: 800, h: 1000 };

describe("snapToPage (US8-1)", () => {
  it("aimante le centre de la boîte sur le centre de la page", () => {
    // centre de la boîte à x = 405, centre de page à 400
    const snap = snapToPage({ left: 355, top: 100, width: 100, height: 50 }, page, 8);
    expect(snap.dx).toBe(-5);
    expect(snap.guideX).toBe(400);
  });

  it("aimante un bord de la boîte sur le bord de la page", () => {
    const snap = snapToPage({ left: 6, top: 300, width: 100, height: 50 }, page, 8);
    expect(snap.dx).toBe(-6);
    expect(snap.guideX).toBe(0);
  });

  it("ne fait rien au-delà du seuil", () => {
    expect(snapToPage({ left: 200, top: 200, width: 100, height: 50 }, page, 8)).toEqual({
      dx: 0,
      dy: 0,
      guideX: null,
      guideY: null,
    });
  });

  it("traite les deux axes indépendamment", () => {
    const snap = snapToPage({ left: 352, top: 473, width: 100, height: 50 }, page, 8);
    expect(snap).toEqual({ dx: -2, dy: 2, guideX: 400, guideY: 500 });
  });
});

describe("alignOnPage (US8-2)", () => {
  const box = { left: 100, top: 200, width: 200, height: 100 };

  it.each([
    ["left", { dx: -100, dy: 0 }],
    ["hcenter", { dx: 200, dy: 0 }],
    ["right", { dx: 500, dy: 0 }],
    ["top", { dx: 0, dy: -200 }],
    ["vcenter", { dx: 0, dy: 250 }],
    ["bottom", { dx: 0, dy: 700 }],
  ] as const)("%s", (where, expected) => {
    expect(alignOnPage(box, page, where)).toEqual(expected);
  });
});
