import { describe, it, expect } from "vitest";
import { instagramHiddenZones } from "./safeZones";

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
