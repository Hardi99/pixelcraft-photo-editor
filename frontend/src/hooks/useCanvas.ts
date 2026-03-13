import { useCallback } from "react";
import { fabric } from "fabric";
import { useEditorStore } from "@/stores/editorStore";
import { FILTER_PRESETS } from "@/lib/filters";
import { downloadDataURL } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useCanvas() {
  const { canvas, pushHistory, setSelectedFilter, setAdjustments, adjustments } =
    useEditorStore();

  const getBackgroundImage = useCallback((): fabric.Image | null => {
    if (!canvas) return null;
    return canvas.backgroundImage as fabric.Image | null;
  }, [canvas]);

  const applyFiltersToImage = useCallback(
    (img: fabric.Image) => {
      img.applyFilters();
      canvas?.renderAll();
    },
    [canvas]
  );

  /** Rebuild filters from preset + manual adjustments */
  const rebuildFilters = useCallback(
    (
      presetName: string,
      adj: typeof adjustments
    ) => {
      const img = getBackgroundImage();
      if (!img) return;

      const preset = FILTER_PRESETS.find((f) => f.name === presetName);
      const filters: fabric.IBaseFilter[] = [];

      // Instagram preset filters
      if (preset) {
        for (const fc of preset.fabricFilters) {
          const FilterClass = (fabric.Image.filters as unknown as Record<string, new (o: object) => fabric.IBaseFilter>)[fc.type];
          if (FilterClass) filters.push(new FilterClass(fc.options));
        }
      }

      // Manual adjustment filters (stacked on top of preset)
      if (adj.brightness !== 0)
        filters.push(new fabric.Image.filters.Brightness({ brightness: adj.brightness }));
      if (adj.contrast !== 0)
        filters.push(new fabric.Image.filters.Contrast({ contrast: adj.contrast }));
      if (adj.saturation !== 0)
        filters.push(new fabric.Image.filters.Saturation({ saturation: adj.saturation }));
      if (adj.blur > 0)
        filters.push(new fabric.Image.filters.Blur({ blur: adj.blur }));

      img.filters = filters;
      applyFiltersToImage(img);
    },
    [getBackgroundImage, applyFiltersToImage, adjustments]
  );

  const applyInstagramFilter = useCallback(
    (filterName: string) => {
      setSelectedFilter(filterName);
      rebuildFilters(filterName, adjustments);
      api.track("filter", { filter: filterName });
    },
    [setSelectedFilter, rebuildFilters, adjustments]
  );

  const applyAdjustment = useCallback(
    (key: keyof typeof adjustments, value: number) => {
      const newAdj = { ...adjustments, [key]: value };
      setAdjustments({ [key]: value });
      const { selectedFilter } = useEditorStore.getState();
      rebuildFilters(selectedFilter, newAdj);
    },
    [adjustments, setAdjustments, rebuildFilters]
  );

  const addText = useCallback(
    (text = "Double-cliquez pour éditer") => {
      if (!canvas) return;
      const itext = new fabric.IText(text, {
        left: 80,
        top: 80,
        fontSize: 36,
        fill: "#ffffff",
        fontFamily: "Arial",
        fontWeight: "bold",
        shadow: new fabric.Shadow({ color: "rgba(0,0,0,0.6)", blur: 8, offsetX: 2, offsetY: 2 }),
        selectable: true,
        editable: true,
      });
      canvas.add(itext);
      canvas.setActiveObject(itext);
      canvas.renderAll();
      pushHistory(JSON.stringify(canvas.toJSON(["data"])));
      api.track("text");
    },
    [canvas, pushHistory]
  );

  const addSticker = useCallback(
    (emoji: string) => {
      if (!canvas) return;
      const sticker = new fabric.Text(emoji, {
        left: 100,
        top: 100,
        fontSize: 64,
        selectable: true,
      });
      canvas.add(sticker);
      canvas.setActiveObject(sticker);
      canvas.renderAll();
      pushHistory(JSON.stringify(canvas.toJSON(["data"])));
      api.track("sticker", { emoji });
    },
    [canvas, pushHistory]
  );

  const deleteSelected = useCallback(() => {
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (obj) {
      canvas.remove(obj);
      canvas.renderAll();
      pushHistory(JSON.stringify(canvas.toJSON(["data"])));
    }
  }, [canvas, pushHistory]);

  const exportPNG = useCallback(
    async (projectId?: number) => {
      if (!canvas) return;
      const dataURL = canvas.toDataURL({ format: "png", multiplier: 2 });
      downloadDataURL(dataURL, "pixelcraft-export.png");
      toast.success("PNG exporté !");

      await api.track("export");

      if (projectId) {
        await api.projects.update(projectId, {
          exports_count: (useEditorStore.getState().currentProject?.exports_count ?? 0) + 1,
        });
      }
    },
    [canvas]
  );

  return { addText, addSticker, deleteSelected, applyInstagramFilter, applyAdjustment, exportPNG };
}
