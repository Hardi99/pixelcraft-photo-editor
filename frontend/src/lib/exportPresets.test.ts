import { describe, it, expect } from "vitest";
import { EXPORT_TARGETS, exportFileName } from "./exportPresets";
import { CANVAS_SIZES } from "@/stores/editorStore";
import type { AspectRatio } from "@/types";

describe("EXPORT_TARGETS", () => {
  it("couvre chaque format de publication", () => {
    expect(Object.keys(EXPORT_TARGETS).sort()).toEqual(Object.keys(CANVAS_SIZES).sort());
  });

  it.each(Object.keys(CANVAS_SIZES) as AspectRatio[])("garde les proportions du canvas %s", (ratio) => {
    const { w, h } = CANVAS_SIZES[ratio];
    const { width, height } = EXPORT_TARGETS[ratio];
    expect(width / height).toBeCloseTo(w / h, 3);
  });

  it("exporte en 1080 px de large pour les formats mobiles", () => {
    expect(EXPORT_TARGETS["1:1"]).toMatchObject({ width: 1080, height: 1080 });
    expect(EXPORT_TARGETS["4:5"]).toMatchObject({ width: 1080, height: 1350 });
    expect(EXPORT_TARGETS["9:16"]).toMatchObject({ width: 1080, height: 1920 });
  });
});

describe("exportFileName", () => {
  it("nomme le fichier d'après le projet, la destination et la taille", () => {
    expect(exportFileName("Coucher de soleil à Étretat", EXPORT_TARGETS["9:16"], "jpeg")).toBe(
      "coucher-de-soleil-a-etretat-story-1080x1920.jpg"
    );
  });

  it("retombe sur un nom par défaut si le titre est vide", () => {
    expect(exportFileName("  ", EXPORT_TARGETS["1:1"], "png")).toBe("pixelcraft-post-1080x1080.png");
  });
});
