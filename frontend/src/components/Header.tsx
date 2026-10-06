import { Undo2, Redo2, Download, Save, LayoutGrid, BarChart2, Edit3 } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useEditorStore } from "@/stores/editorStore";
import { useCanvas } from "@/hooks/useCanvas";
import { useSaveProject } from "@/hooks/useProjects";
import { serializeLayers } from "@/lib/layers";
import { canvasThumbnail } from "@/lib/scene";
import type { ProjectInput } from "@/types";
import { toast } from "sonner";

export function Header() {
  const { projectTitle, setProjectTitle, activeView, setActiveView, undo, redo, imageLoaded } =
    useEditorStore(
      useShallow((s) => ({
        projectTitle: s.projectTitle,
        setProjectTitle: s.setProjectTitle,
        activeView: s.activeView,
        setActiveView: s.setActiveView,
        undo: s.undo,
        redo: s.redo,
        imageLoaded: s.imageLoaded,
      }))
    );
  const canUndo = useEditorStore((s) => s.historyIndex > 0);
  const canRedo = useEditorStore((s) => s.historyIndex < s.history.length - 1);

  const { exportPNG } = useCanvas();
  const saveProject = useSaveProject();

  async function handleSave() {
    const s = useEditorStore.getState();
    if (!s.canvas || !s.imageLoaded || !s.imageUrl) return;

    try {
      const input: ProjectInput = {
        title: s.projectTitle,
        layers: serializeLayers(s.canvas),
        settings: { aspect_ratio: s.aspectRatio, filter: s.selectedFilter, adjustments: s.adjustments },
        thumbnail: await canvasThumbnail(s.canvas),
        // Temps écoulé depuis la dernière sauvegarde : le serveur l'additionne.
        editingSeconds: s.getEditingTime(),
      };
      // La photo d'origine n'est envoyée qu'à la création ; ensuite seuls les calques changent.
      if (!s.currentProject) input.image = s.imageFile ?? (await fetch(s.imageUrl).then((r) => r.blob()));

      const project = await saveProject.mutateAsync({ id: s.currentProject?.id, input });
      s.setCurrentProject(project);
      s.startEditingTimer();
      toast.success(s.currentProject ? "Modifications enregistrées !" : "Projet sauvegardé !");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    }
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 z-20 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Edit3 className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-bold tracking-tight">PixelCraft</span>
      </div>

      {/* Project title (editable) */}
      {activeView === "editor" && (
        <input
          value={projectTitle}
          onChange={(e) => setProjectTitle(e.target.value)}
          className="w-48 bg-transparent text-center text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-primary rounded px-2 py-1"
          placeholder="Nom du projet"
        />
      )}

      {/* Nav + actions */}
      <div className="flex items-center gap-1">
        {/* View tabs */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeView === "editor" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveView("editor")}
            >
              <Edit3 className="h-4 w-4" />
              <span className="hidden sm:inline">Éditeur</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Éditeur de photos</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeView === "gallery" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveView("gallery")}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Galerie</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Projets sauvegardés</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeView === "dashboard" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveView("dashboard")}
            >
              <BarChart2 className="h-4 w-4" />
              <span className="hidden sm:inline">Insights</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>KPI & Insights</TooltipContent>
        </Tooltip>

        <div className="mx-2 h-6 w-px bg-zinc-700" />

        {/* Undo / Redo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" disabled={!canUndo} onClick={undo}>
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Annuler (Ctrl+Z)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" disabled={!canRedo} onClick={redo}>
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Rétablir (Ctrl+Y)</TooltipContent>
        </Tooltip>

        <div className="mx-2 h-6 w-px bg-zinc-700" />

        {/* Save */}
        <Button
          variant="outline"
          size="sm"
          disabled={!imageLoaded || saveProject.isPending}
          onClick={handleSave}
          className="border-zinc-700"
        >
          <Save className="h-4 w-4" />
          <span className="hidden sm:inline">
            {saveProject.isPending ? "Sauvegarde…" : "Sauvegarder"}
          </span>
        </Button>

        {/* Export */}
        <Button
          size="sm"
          disabled={!imageLoaded}
          onClick={exportPNG}
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Exporter PNG</span>
        </Button>
      </div>
    </header>
  );
}
