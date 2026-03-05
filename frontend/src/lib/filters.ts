import type { FilterPreset } from "@/types";

export const FILTER_PRESETS: FilterPreset[] = [
  {
    name: "normal",
    label: "Normal",
    fabricFilters: [],
    cssPreview: "",
  },
  {
    name: "clarendon",
    label: "Clarendon",
    fabricFilters: [
      { type: "Brightness", options: { brightness: 0.05 } },
      { type: "Contrast", options: { contrast: 0.1 } },
      { type: "Saturation", options: { saturation: 0.35 } },
    ],
    cssPreview: "brightness(1.05) contrast(1.1) saturate(1.35)",
  },
  {
    name: "gingham",
    label: "Gingham",
    fabricFilters: [
      { type: "Brightness", options: { brightness: 0.05 } },
      { type: "HueRotation", options: { rotation: -0.03 } },
    ],
    cssPreview: "brightness(1.05) hue-rotate(-10deg)",
  },
  {
    name: "moon",
    label: "Moon",
    fabricFilters: [
      { type: "Grayscale", options: {} },
      { type: "Brightness", options: { brightness: 0.1 } },
      { type: "Contrast", options: { contrast: 0.1 } },
    ],
    cssPreview: "grayscale(1) brightness(1.1) contrast(1.1)",
  },
  {
    name: "lark",
    label: "Lark",
    fabricFilters: [
      { type: "Brightness", options: { brightness: 0.1 } },
      { type: "Saturation", options: { saturation: 0.15 } },
    ],
    cssPreview: "brightness(1.1) saturate(1.15)",
  },
  {
    name: "reyes",
    label: "Reyes",
    fabricFilters: [
      { type: "Sepia", options: { sepia: 0.4 } },
      { type: "Brightness", options: { brightness: 0.1 } },
      { type: "Contrast", options: { contrast: -0.1 } },
    ],
    cssPreview: "sepia(0.4) brightness(1.1) contrast(0.9)",
  },
  {
    name: "juno",
    label: "Juno",
    fabricFilters: [
      { type: "Saturation", options: { saturation: 0.4 } },
      { type: "Contrast", options: { contrast: 0.1 } },
    ],
    cssPreview: "saturate(1.4) contrast(1.1)",
  },
  {
    name: "slumber",
    label: "Slumber",
    fabricFilters: [
      { type: "Brightness", options: { brightness: -0.1 } },
      { type: "Saturation", options: { saturation: -0.3 } },
      { type: "Sepia", options: { sepia: 0.3 } },
    ],
    cssPreview: "brightness(0.9) saturate(0.7) sepia(0.3)",
  },
  {
    name: "crema",
    label: "Crema",
    fabricFilters: [
      { type: "Sepia", options: { sepia: 0.2 } },
      { type: "Brightness", options: { brightness: 0.05 } },
      { type: "Saturation", options: { saturation: -0.1 } },
    ],
    cssPreview: "sepia(0.2) brightness(1.05) saturate(0.9)",
  },
  {
    name: "ludwig",
    label: "Ludwig",
    fabricFilters: [
      { type: "Brightness", options: { brightness: 0.05 } },
      { type: "Contrast", options: { contrast: 0.05 } },
      { type: "Saturation", options: { saturation: 0.1 } },
    ],
    cssPreview: "brightness(1.05) contrast(1.05) saturate(1.1)",
  },
  {
    name: "aden",
    label: "Aden",
    fabricFilters: [
      { type: "HueRotation", options: { rotation: -0.05 } },
      { type: "Brightness", options: { brightness: 0.1 } },
      { type: "Saturation", options: { saturation: -0.1 } },
    ],
    cssPreview: "hue-rotate(-20deg) brightness(1.1) saturate(0.9)",
  },
];
