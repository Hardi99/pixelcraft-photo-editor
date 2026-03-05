import { Undo2, Redo2, Download, Save, LayoutGrid, BarChart2, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useEditorStore } from "@/stores/editorStore";
import { useCanvas } from "@/hooks/useCanvas";
import { useUpdateProject, useCreateProject } from "@/hooks/useProjects";
import { api } from "@/lib/api";

export function Header() {
  const {
    canvas,
    currentProject,
    projectTitle,
    setProjectTitle,
    activeView,
    setActiveView,
    undo,
    redo,
    canUndo,
    canRedo,
    getEditingTime,
    imageLoaded,
  } = useEditorStore();

  const { exportPNG } = useCanvas();
  const updateProject = useUpdateProject();
  const createProject = useCreateProject();

  async function handleSave() {
    if (!canvas || !imageLoaded) return;

    const layers = JSON.stringify(canvas.toJSON(["id", "name"]));
    const editingTime = getEditingTime();

    if (currentProject) {
      await updateProject.mutateAsync({
        id: currentProject.id,
        data: { layers_json: layers, editing_time: editingTime, title: projectTitle },
      });
    } else {
      const fd = new FormData();
      fd.append("project[title]", projectTitle);
      fd.append("project[layers_json]", layers);
      fd.append("project[editing_time]", String(editingTime));
      await createProject.mutateAsync(fd);
    }

    api.track("save");
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
            <Button variant="ghost" size="icon" disabled={!canUndo()} onClick={undo}>
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Annuler (Ctrl+Z)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" disabled={!canRedo()} onClick={redo}>
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
          disabled={!imageLoaded || updateProject.isPending || createProject.isPending}
          onClick={handleSave}
          className="border-zinc-700"
        >
          <Save className="h-4 w-4" />
          <span className="hidden sm:inline">
            {updateProject.isPending || createProject.isPending ? "Sauvegarde…" : "Sauvegarder"}
          </span>
        </Button>

        {/* Export */}
        <Button
          size="sm"
          disabled={!imageLoaded}
          onClick={() => exportPNG(currentProject?.id)}
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Exporter PNG</span>
        </Button>
      </div>
    </header>
  );
}
