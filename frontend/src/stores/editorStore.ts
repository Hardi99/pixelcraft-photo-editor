import { create } from "zustand";
import { assetUrl } from "@/lib/api";
import { restoreLayers } from "@/lib/layers";
import type { ActiveTool, AspectRatio, AppView, CanvasLayers, ImageAdjustments, PreviewNetwork, Project } from "@/types";

// Avoid importing fabric types here to prevent circular deps
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FabricCanvas = any;

export const CANVAS_SIZES: Record<AspectRatio, { w: number; h: number }> = {
  "1:1": { w: 800, h: 800 },
  "4:5": { w: 800, h: 1000 },
  "3:4": { w: 750, h: 1000 },
  "16:9": { w: 960, h: 540 },
  "9:16": { w: 540, h: 960 },
};

export const DEFAULT_ADJUSTMENTS: ImageAdjustments = { brightness: 0, contrast: 0, saturation: 0, blur: 0 };

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
  /** Photo d'origine : data URL après un upload, URL ActiveStorage pour un projet rouvert. */
  imageUrl: string | null;
  /** Fichier d'origine, envoyé au backend à la première sauvegarde. */
  imageFile: Blob | null;
  /** Calques à poser au prochain montage du canvas (projet rouvert). */
  pendingLayers: CanvasLayers | null;
  /** Incrémenté pour forcer la reconstruction du canvas (ouverture d'un projet). */
  sceneId: number;
  /** Aperçu du réseau choisi : zones masquées ou rognées (repères jamais exportés). */
  previewNetwork: PreviewNetwork | null;
  /** Incrémenté à chaque sélection ou modification d'objet : les panneaux se relisent. */
  selectionTick: number;

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
  setImage: (url: string | null, file?: Blob | null) => void;
  setPreviewNetwork: (network: PreviewNetwork | null) => void;
  bumpSelection: () => void;
  openProject: (project: Project) => void;
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
  adjustments: DEFAULT_ADJUSTMENTS,
  selectedObjectId: null,
  history: [],
  historyIndex: -1,
  currentProject: null,
  projectTitle: "Mon projet",
  editingStartTime: null,
  imageUrl: null,
  imageFile: null,
  pendingLayers: null,
  sceneId: 0,
  previewNetwork: "instagram",
  selectionTick: 0,

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
  setImage: (imageUrl, imageFile = null) => set({ imageUrl, imageFile }),
  setPreviewNetwork: (previewNetwork) => set({ previewNetwork }),
  bumpSelection: () => set((s) => ({ selectionTick: s.selectionTick + 1 })),

  openProject: (project) =>
    set((s) => ({
      currentProject: project,
      projectTitle: project.title,
      aspectRatio: project.settings.aspect_ratio ?? "1:1",
      selectedFilter: project.settings.filter ?? "normal",
      adjustments: { ...DEFAULT_ADJUSTMENTS, ...project.settings.adjustments },
      imageUrl: assetUrl(project.image_url),
      imageFile: null,
      pendingLayers: project.layers ?? { objects: [] },
      imageLoaded: true,
      activeTool: "select",
      activeView: "editor",
      history: [],
      historyIndex: -1,
      editingStartTime: Date.now(),
      sceneId: s.sceneId + 1,
    })),

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
    set({ historyIndex: historyIndex - 1 });
    restoreLayers(canvas, history[historyIndex - 1]);
  },

  redo: () => {
    const { canvas, history, historyIndex } = get();
    if (!canvas || historyIndex >= history.length - 1) return;
    set({ historyIndex: historyIndex + 1 });
    restoreLayers(canvas, history[historyIndex + 1]);
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  resetEditor: () =>
    set({
      imageLoaded: false,
      activeTool: "select",
      selectedFilter: "normal",
      adjustments: DEFAULT_ADJUSTMENTS,
      history: [],
      historyIndex: -1,
      currentProject: null,
      projectTitle: "Mon projet",
      editingStartTime: null,
      imageUrl: null,
      imageFile: null,
      pendingLayers: null,
    }),
}));
