import { describe, it, expect, beforeEach } from "vitest";
import { useEditorStore } from "./editorStore";

beforeEach(() => {
  useEditorStore.setState({ canvas: null });
  useEditorStore.getState().resetEditor();
});

describe("pushHistory", () => {
  it("ajoute un snapshot et incrémente historyIndex", () => {
    useEditorStore.getState().pushHistory("snap1");
    expect(useEditorStore.getState().history).toEqual(["snap1"]);
    expect(useEditorStore.getState().historyIndex).toBe(0);
  });

  it("tronque les états futurs après un undo puis push", () => {
    useEditorStore.getState().pushHistory("snap1");
    useEditorStore.getState().pushHistory("snap2");
    useEditorStore.getState().pushHistory("snap3");
    useEditorStore.setState({ historyIndex: 1 });
    useEditorStore.getState().pushHistory("snap4");
    const { history, historyIndex } = useEditorStore.getState();
    expect(history).toEqual(["snap1", "snap2", "snap4"]);
    expect(historyIndex).toBe(2);
  });

  it("plafonne l'historique à 50 entrées", () => {
    for (let i = 0; i < 55; i++) useEditorStore.getState().pushHistory(`snap${i}`);
    expect(useEditorStore.getState().history.length).toBe(50);
    expect(useEditorStore.getState().historyIndex).toBe(49);
  });
});

describe("canUndo / canRedo", () => {
  it("canUndo est false sans historique", () => {
    expect(useEditorStore.getState().canUndo()).toBe(false);
  });

  it("canUndo est false au premier snapshot (index 0)", () => {
    useEditorStore.getState().pushHistory("snap1");
    expect(useEditorStore.getState().canUndo()).toBe(false);
  });

  it("canUndo est true quand historyIndex > 0", () => {
    useEditorStore.getState().pushHistory("snap1");
    useEditorStore.getState().pushHistory("snap2");
    expect(useEditorStore.getState().canUndo()).toBe(true);
  });

  it("canRedo est false au dernier index", () => {
    useEditorStore.getState().pushHistory("snap1");
    expect(useEditorStore.getState().canRedo()).toBe(false);
  });

  it("canRedo est true après un undo simulé", () => {
    useEditorStore.getState().pushHistory("snap1");
    useEditorStore.getState().pushHistory("snap2");
    useEditorStore.setState({ historyIndex: 0 });
    expect(useEditorStore.getState().canRedo()).toBe(true);
  });
});

describe("undo / redo sans canvas", () => {
  it("undo est un no-op si canvas est null", () => {
    useEditorStore.getState().pushHistory("snap1");
    useEditorStore.getState().pushHistory("snap2");
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().historyIndex).toBe(1);
  });

  it("redo est un no-op si canvas est null", () => {
    useEditorStore.getState().pushHistory("snap1");
    useEditorStore.getState().pushHistory("snap2");
    useEditorStore.setState({ historyIndex: 0 });
    useEditorStore.getState().redo();
    expect(useEditorStore.getState().historyIndex).toBe(0);
  });
});

describe("setAdjustments", () => {
  it("merge les ajustements partiels sans écraser les autres", () => {
    useEditorStore.getState().setAdjustments({ brightness: 0.4 });
    const { adjustments } = useEditorStore.getState();
    expect(adjustments.brightness).toBe(0.4);
    expect(adjustments.contrast).toBe(0);
    expect(adjustments.saturation).toBe(0);
    expect(adjustments.blur).toBe(0);
  });
});

describe("resetEditor", () => {
  it("remet tous les champs à leur valeur initiale", () => {
    useEditorStore.getState().pushHistory("snap1");
    useEditorStore.getState().setImageLoaded(true);
    useEditorStore.getState().startEditingTimer();
    useEditorStore.getState().setAdjustments({ brightness: 0.5 });
    useEditorStore.getState().resetEditor();
    const s = useEditorStore.getState();
    expect(s.imageLoaded).toBe(false);
    expect(s.history).toEqual([]);
    expect(s.historyIndex).toBe(-1);
    expect(s.editingStartTime).toBeNull();
    expect(s.imageUrl).toBeNull();
    expect(s.adjustments).toEqual({ brightness: 0, contrast: 0, saturation: 0, blur: 0 });
  });
});

describe("getEditingTime", () => {
  it("retourne 0 si le timer n'a pas démarré", () => {
    expect(useEditorStore.getState().getEditingTime()).toBe(0);
  });

  it("retourne une durée positive après démarrage", () => {
    useEditorStore.getState().startEditingTimer();
    const t = useEditorStore.getState().getEditingTime();
    expect(t).toBeGreaterThanOrEqual(0);
  });
});
