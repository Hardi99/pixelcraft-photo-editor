import { create } from "zustand";
import type { ActiveTool, AspectRatio, ImageAdjustments, AppView, Project } from "@/types";

// Avoid importing fabric types here to prevent circular deps
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FabricCanvas = any;

export const CANVAS_SIZES: Record<AspectRatio, { w: number; h: number }> = {
  "1:1": { w: 800, h: 800 },
  "4:5": { w: 800, h: 1000 },
  "16:9": { w: 960, h: 540 },
  "9:16": { w: 540, h: 960 },
};

interface EditorStore {
  canvas: FabricCanvas | null;
  imageLoaded: boolean;
  activeTool: ActiveTool;
  activeView: AppView;
  aspectRatio: AspectRatio;
  selectedFilter: string;
  adjustments: ImageAdjustments;
  selectedObjectId: string | null;
  history: string[];
  historyIndex: number;
  currentProject: Project | null;
  projectTitle: string;
  editingStartTime: number | null;
  imageUrl: string | null;

  setCanvas: (canvas: FabricCanvas) => void;
  setImageLoaded: (loaded: boolean) => void;
  setActiveTool: (tool: ActiveTool) => void;
  setActiveView: (view: AppView) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  setSelectedFilter: (filter: string) => void;
  setAdjustments: (adj: Partial<ImageAdjustments>) => void;
  setSelectedObjectId: (id: string | null) => void;
  setCurrentProject: (project: Project | null) => void;
  setProjectTitle: (title: string) => void;
  setImageUrl: (url: string | null) => void;
  startEditingTimer: () => void;
  getEditingTime: () => number;
  pushHistory: (snapshot: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  resetEditor: () => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  canvas: null,
  imageLoaded: false,
  activeTool: "select",
  activeView: "editor",
  aspectRatio: "1:1",
  selectedFilter: "normal",
  adjustments: { brightness: 0, contrast: 0, saturation: 0, blur: 0 },
  selectedObjectId: null,
  history: [],
  historyIndex: -1,
  currentProject: null,
  projectTitle: "Mon projet",
  editingStartTime: null,
  imageUrl: null,

  setCanvas: (canvas) => set({ canvas }),
  setImageLoaded: (imageLoaded) => set({ imageLoaded }),
  setActiveTool: (activeTool) => set({ activeTool }),
  setActiveView: (activeView) => set({ activeView }),
  setAspectRatio: (aspectRatio) => set({ aspectRatio }),
  setSelectedFilter: (selectedFilter) => set({ selectedFilter }),
  setAdjustments: (adj) =>
    set((s) => ({ adjustments: { ...s.adjustments, ...adj } })),
  setSelectedObjectId: (selectedObjectId) => set({ selectedObjectId }),
  setCurrentProject: (currentProject) => set({ currentProject }),
  setProjectTitle: (projectTitle) => set({ projectTitle }),
  setImageUrl: (imageUrl) => set({ imageUrl }),
  startEditingTimer: () => set({ editingStartTime: Date.now() }),

  getEditingTime: () => {
    const start = get().editingStartTime;
    return start ? Math.floor((Date.now() - start) / 1000) : 0;
  },

  pushHistory: (snapshot) =>
    set((s) => {
      const trimmed = s.history.slice(0, s.historyIndex + 1);
      const next = [...trimmed, snapshot].slice(-50);
      return { history: next, historyIndex: next.length - 1 };
    }),

  undo: () => {
    const { canvas, history, historyIndex } = get();
    if (!canvas || historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    set({ historyIndex: newIndex });
    canvas.loadFromJSON(history[newIndex], () => canvas.renderAll());
  },

  redo: () => {
    const { canvas, history, historyIndex } = get();
    if (!canvas || historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    set({ historyIndex: newIndex });
    canvas.loadFromJSON(history[newIndex], () => canvas.renderAll());
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  resetEditor: () =>
    set({
      imageLoaded: false,
      activeTool: "select",
      selectedFilter: "normal",
      adjustments: { brightness: 0, contrast: 0, saturation: 0, blur: 0 },
      history: [],
      historyIndex: -1,
      currentProject: null,
      projectTitle: "Mon projet",
      editingStartTime: null,
      imageUrl: null,
    }),
}));
