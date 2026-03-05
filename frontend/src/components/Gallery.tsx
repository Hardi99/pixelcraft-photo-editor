import { Trash2, FolderOpen, Clock, Download, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProjects, useDeleteProject } from "@/hooks/useProjects";
import { useEditorStore } from "@/stores/editorStore";
import { formatDate, formatTime } from "@/lib/utils";
import { fabric } from "fabric";
import type { Project } from "@/types";

export function Gallery() {
  const { data: projects, isLoading } = useProjects();
  const deleteProject = useDeleteProject();
  const { canvas, setActiveView, setImageLoaded, setCurrentProject, setProjectTitle, startEditingTimer, pushHistory } =
    useEditorStore();

  function openProject(project: Project) {
    if (!canvas || !project.image_url) return;

    setCurrentProject(project);
    setProjectTitle(project.title);

    fabric.Image.fromURL(
      project.image_url,
      (img) => {
        const imgScale = Math.max(canvas.width! / img.width!, canvas.height! / img.height!);
        img.set({
          scaleX: imgScale,
          scaleY: imgScale,
          left: (canvas.width! - img.width! * imgScale) / 2,
          top: (canvas.height! - img.height! * imgScale) / 2,
          selectable: false,
          evented: false,
        });
        canvas.clear();
        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));

        if (project.layers_json) {
          const data = JSON.parse(project.layers_json);
          canvas.loadFromJSON({ ...data, backgroundImage: undefined }, () => {
            canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
          });
        }

        setImageLoaded(true);
        startEditingTimer();
        pushHistory(JSON.stringify(canvas.toJSON(["data"])));
        setActiveView("editor");
      },
      { crossOrigin: "anonymous" }
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!projects?.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-zinc-500">
        <ImageOff className="h-12 w-12" />
        <p className="text-sm">Aucun projet sauvegardé</p>
        <Button variant="outline" onClick={() => useEditorStore.getState().setActiveView("editor")}>
          Créer un projet
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Mes projets</h2>
        <p className="mt-1 text-sm text-zinc-500">{projects.length} projet{projects.length > 1 ? "s" : ""} sauvegardé{projects.length > 1 ? "s" : ""}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-600"
          >
            {/* Thumbnail */}
            <div className="relative aspect-square overflow-hidden bg-zinc-800">
              {project.image_url ? (
                <img
                  src={project.image_url}
                  alt={project.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-zinc-800 to-zinc-900">
                  <ImageOff className="h-8 w-8 text-zinc-600" />
                  <span className="text-xs text-zinc-600">Pas d'aperçu</span>
                </div>
              )}

              {/* Overlay actions */}
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                <Button size="icon" className="h-8 w-8" onClick={() => openProject(project)}>
                  <FolderOpen className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-8 w-8"
                  onClick={() => deleteProject.mutate(project.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Info */}
            <div className="p-3">
              <p className="truncate text-sm font-medium">{project.title}</p>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-xs text-zinc-500">{formatDate(project.created_at)}</span>
                <div className="flex gap-1">
                  {project.exports_count > 0 && (
                    <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-[10px]">
                      <Download className="h-2.5 w-2.5" />
                      {project.exports_count}
                    </Badge>
                  )}
                  {project.editing_time > 0 && (
                    <Badge variant="outline" className="gap-1 px-1.5 py-0 text-[10px]">
                      <Clock className="h-2.5 w-2.5" />
                      {formatTime(project.editing_time)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
