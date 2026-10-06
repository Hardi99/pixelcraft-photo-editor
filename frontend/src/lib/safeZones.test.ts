import { describe, it, expect } from "vitest";
import { instagramHiddenZones, xHiddenZones } from "./safeZones";

describe("instagramHiddenZones", () => {
  it("story : masque le haut (14 %) et le bas (20 %)", () => {
    expect(instagramHiddenZones("9:16")).toEqual([
      expect.objectContaining({ edge: "top", size: 0.14 }),
      expect.objectContaining({ edge: "bottom", size: 0.2 }),
    ]);
  });

  it("3:4 : rien n'est rogné dans la grille du profil", () => {
    expect(instagramHiddenZones("3:4")).toEqual([]);
  });

  it("carré : la grille en 3:4 rogne 12,5 % de chaque côté", () => {
    const [left, right] = instagramHiddenZones("1:1");
    expect(left).toMatchObject({ edge: "left" });
    expect(left.size).toBeCloseTo(0.125);
    expect(right.size).toBeCloseTo(0.125);
  });

  it("4:5 : environ 34 px rognés de chaque côté sur 1080 px", () => {
    expect(instagramHiddenZones("4:5")[0].size * 1080).toBeCloseTo(33.75, 1);
  });
});

describe("xHiddenZones (US7-3)", () => {
  it("16:9 : rien n'est recadré", () => {
    expect(xHiddenZones("16:9")).toEqual([]);
  });

  it("carré : le fil garde une bande 16:9 centrée (21,875 % masqués en haut et en bas)", () => {
    const [top, bottom] = xHiddenZones("1:1");
    expect(top).toMatchObject({ edge: "top" });
    expect(top.size).toBeCloseTo(0.21875);
    expect(bottom.size).toBeCloseTo(0.21875);
  });

  it("story : seule une fine bande centrale reste visible", () => {
    const [top] = xHiddenZones("9:16");
    // hauteur visible = largeur × 9/16 = 1080 × 9/16 = 607,5 px sur 1920
    expect(1 - 2 * top.size).toBeCloseTo(607.5 / 1920, 3);
  });
});
