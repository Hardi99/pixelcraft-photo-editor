import { describe, it, expect, vi } from "vitest";
import { restoreLayers, serializeLayers, snapshot, type LayeredCanvas } from "./layers";

function fakeCanvas(json: Record<string, unknown> = {}): LayeredCanvas & { calls: string[] } {
  const calls: string[] = [];
  const objects = [
    { data: { id: "a", locked: true }, set: vi.fn() },
    { data: { id: "b" }, set: vi.fn() },
  ];
  const canvas = {
    calls,
    backgroundImage: { src: "photo" } as unknown,
    viewportTransform: [0.5, 0, 0, 0.5, 0, 0],
    getObjects: vi.fn(() => objects),
    toObject: vi.fn(() => ({ version: "7.4.0", objects: [{ type: "IText" }], backgroundImage: { src: "data:image/png;base64,AAAA" }, ...json })),
    loadFromJSON: vi.fn(async () => {
      // Comportement de Fabric : le fond et le zoom sont réinitialisés
      canvas.backgroundImage = undefined;
      canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
      calls.push("load");
    }),
    setViewportTransform: vi.fn((vpt: number[]) => {
      canvas.viewportTransform = vpt;
      calls.push("viewport");
    }),
    requestRenderAll: vi.fn(() => calls.push("render")),
  };
  return canvas;
}

describe("serializeLayers", () => {
  it("exclut l'image de fond (pas de base64 dans l'historique ni en base)", () => {
    const layers = serializeLayers(fakeCanvas());
    expect(layers).not.toHaveProperty("backgroundImage");
    expect(layers.objects).toEqual([{ type: "IText" }]);
  });

  it("inclut la propriété custom data (identifiant des calques)", () => {
    const canvas = fakeCanvas();
    serializeLayers(canvas);
    expect(canvas.toObject).toHaveBeenCalledWith(["data"]);
  });

  it("snapshot produit une chaîne JSON compacte", () => {
    expect(snapshot(fakeCanvas())).not.toContain("base64");
  });
});

describe("restoreLayers", () => {
  it("conserve la photo de fond et le zoom après loadFromJSON", async () => {
    const canvas = fakeCanvas();
    const background = canvas.backgroundImage;

    await restoreLayers(canvas, { objects: [] });

    expect(canvas.backgroundImage).toBe(background);
    expect(canvas.viewportTransform).toEqual([0.5, 0, 0, 0.5, 0, 0]);
    expect(canvas.calls).toEqual(["load", "viewport", "render"]);
  });

  it("accepte un instantané d'historique sous forme de chaîne JSON", async () => {
    const canvas = fakeCanvas();
    await restoreLayers(canvas, JSON.stringify({ objects: [{ type: "IText" }] }));
    expect(canvas.loadFromJSON).toHaveBeenCalledWith({ objects: [{ type: "IText" }] });
  });
});

describe("verrou (US8-5)", () => {
  it("réapplique le verrou stocké dans data.locked après un chargement", async () => {
    const canvas = fakeCanvas();
    await restoreLayers(canvas, { objects: [] });

    const [locked, free] = canvas.getObjects() as unknown as { set: ReturnType<typeof vi.fn> }[];
    expect(locked.set).toHaveBeenCalledWith(expect.objectContaining({ lockMovementX: true, hasControls: false, editable: false }));
    expect(free.set).toHaveBeenCalledWith(expect.objectContaining({ lockMovementX: false, hasControls: true }));
  });
});
