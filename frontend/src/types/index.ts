export interface Project {
  id: number;
  title: string;
  layers_json: string | null;
  editing_time: number;
  exports_count: number;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiEvent {
  action_name: string;
  metadata?: Record<string, unknown>;
}

export interface Stats {
  total_projects: number;
  total_exports: number;
  total_events: number;
  avg_editing_time: number;
  tool_usage: Record<string, number>;
  funnel: {
    uploaded: number;
    edited: number;
    exported: number;
  };
  recent_activity: Array<{ action: string; at: string }>;
}

export type ActiveTool = "select" | "text" | "sticker" | "crop";

export type AspectRatio = "1:1" | "4:5" | "16:9" | "9:16";

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

export interface ImageAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
}

export type AppView = "editor" | "gallery" | "dashboard";
