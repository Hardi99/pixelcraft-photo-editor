import type { AspectRatio } from "@/types";

export type ExportFormat = "jpeg" | "png";

export interface ExportTarget {
  /** Identifiant stable, envoyé au backend pour les statistiques. */
  id: "post" | "portrait" | "story" | "landscape";
  label: string;
  width: number;
  height: number;
  platforms: string;
}

/**
 * Une destination par format de publication. Largeur de 1080 px pour les
 * formats mobiles (référence Instagram), Full HD pour le paysage.
 */
export const EXPORT_TARGETS: Record<AspectRatio, ExportTarget> = {
  "1:1": { id: "post", label: "Publication carrée", width: 1080, height: 1080, platforms: "Instagram, Facebook, LinkedIn" },
  "4:5": { id: "portrait", label: "Publication portrait", width: 1080, height: 1350, platforms: "Instagram, Facebook" },
  "9:16": { id: "story", label: "Story et vidéo verticale", width: 1080, height: 1920, platforms: "Stories Instagram et Facebook, Reels, TikTok" },
  "16:9": { id: "landscape", label: "Paysage", width: 1920, height: 1080, platforms: "Miniature YouTube, X, LinkedIn" },
};

export const EXPORT_FORMATS: Record<ExportFormat, { label: string; hint: string; mime: string; extension: string }> = {
  jpeg: { label: "JPEG", hint: "Fichier léger, recommandé pour publier", mime: "image/jpeg", extension: "jpg" },
  png: { label: "PNG", hint: "Sans perte, fichier plus lourd", mime: "image/png", extension: "png" },
};

export function exportFileName(title: string, target: ExportTarget, format: ExportFormat): string {
  const slug =
    title
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "pixelcraft";
  return `${slug}-${target.id}-${target.width}x${target.height}.${EXPORT_FORMATS[format].extension}`;
}
