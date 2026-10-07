export type ActiveTool = "select" | "text" | "sticker" | "crop";

export type AspectRatio = "1:1" | "4:5" | "3:4" | "9:16" | "16:9";

export type AppView = "editor" | "gallery" | "dashboard";

export type PreviewNetwork = "instagram" | "x";

export interface ImageAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
}

/** Calques Fabric.js sérialisés (texte, stickers), sans l'image de fond. */
export interface CanvasLayers {
  objects?: unknown[];
  [key: string]: unknown;
}

export interface ProjectSettings {
  aspect_ratio?: AspectRatio;
  filter?: string;
  adjustments?: ImageAdjustments;
}

export interface Project {
  id: number;
  title: string;
  editing_time: number;
  exports_count: number;
  settings: ProjectSettings;
  image_url: string | null;
  thumbnail_url: string | null;
  layers?: CanvasLayers;
  created_at: string;
  updated_at: string;
}

export interface ProjectPage {
  projects: Project[];
  meta: { page: number; per_page: number; total: number };
}

export interface ProjectInput {
  title?: string;
  image?: Blob;
  thumbnail?: Blob;
  layers?: CanvasLayers;
  settings?: ProjectSettings;
  editingSeconds?: number;
}

export type TrackedAction = "upload" | "text" | "sticker" | "filter" | "crop" | "export";

export interface Stats {
  total_projects: number;
  total_exports: number;
  total_events: number;
  avg_editing_time: number;
  tool_usage: Record<string, number>;
  exports_by_target: Record<string, number>;
  funnel: {
    uploaded: number;
    edited: number;
    exported: number;
  };
  recent_activity: Array<{ action: string; at: string }>;
}

export interface FilterPreset {
  name: string;
  label: string;
  fabricFilters: FabricFilterConfig[];
  cssPreview: string;
}

export interface FabricFilterConfig {
  type: string;
  options: Record<string, number>;
}
