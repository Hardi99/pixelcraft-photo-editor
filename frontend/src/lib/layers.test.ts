import { describe, it, expect, vi } from "vitest";
import { restoreLayers, serializeLayers, snapshot, type LayeredCanvas } from "./layers";

function fakeCanvas(json: Record<string, unknown> = {}): LayeredCanvas & { calls: string[] } {
  const calls: string[] = [];
  const canvas = {
    calls,
    backgroundImage: { src: "photo" } as unknown,
    viewportTransform: [0.5, 0, 0, 0.5, 0, 0],
    toJSON: vi.fn(() => ({ version: "5.3.0", objects: [{ type: "i-text" }], backgroundImage: { src: "data:image/png;base64,AAAA" }, ...json })),
    loadFromJSON: vi.fn((_json: unknown, cb: () => void) => {
      // Comportement de Fabric : le fond et le zoom sont réinitialisés
      canvas.backgroundImage = undefined;
      canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
      calls.push("load");
      cb();
    }),
    setBackgroundImage: vi.fn((img: unknown) => {
      canvas.backgroundImage = img;
      calls.push("background");
    }),
    setViewportTransform: vi.fn((vpt: number[]) => {
      canvas.viewportTransform = vpt;
      calls.push("viewport");
    }),
    renderAll: vi.fn(() => calls.push("render")),
  };
  return canvas;
}

describe("serializeLayers", () => {
  it("exclut l'image de fond (pas de base64 dans l'historique ni en base)", () => {
    const layers = serializeLayers(fakeCanvas());
    expect(layers).not.toHaveProperty("backgroundImage");
    expect(layers.objects).toEqual([{ type: "i-text" }]);
  });

  it("inclut la propriété custom data (identifiant des calques)", () => {
    const canvas = fakeCanvas();
    serializeLayers(canvas);
    expect(canvas.toJSON).toHaveBeenCalledWith(["data"]);
  });

  it("snapshot produit une chaîne JSON compacte", () => {
    expect(snapshot(fakeCanvas())).not.toContain("base64");
  });
});

describe("restoreLayers", () => {
  it("conserve la photo de fond et le zoom après loadFromJSON", () => {
    const canvas = fakeCanvas();
    const background = canvas.backgroundImage;
    const done = vi.fn();

    restoreLayers(canvas, { objects: [] }, done);

    expect(canvas.backgroundImage).toBe(background);
    expect(canvas.viewportTransform).toEqual([0.5, 0, 0, 0.5, 0, 0]);
    expect(canvas.calls).toEqual(["load", "background", "viewport", "render"]);
    expect(done).toHaveBeenCalledOnce();
  });
});
