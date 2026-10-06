import { useState } from "react";
import { Trash2, FolderOpen, Clock, Download, ImageOff, Check, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProjects, useDeleteProject } from "@/hooks/useProjects";
import { useEditorStore } from "@/stores/editorStore";
import { api, assetUrl } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/utils";
import { toast } from "sonner";
import type { Project } from "@/types";

export function Gallery() {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useProjects();
  const deleteProject = useDeleteProject();
  const qc = useQueryClient();
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const projects = data?.pages.flatMap((page) => page.projects) ?? [];
  const total = data?.pages[0]?.meta.total ?? 0;

  async function openProject(project: Project) {
    try {
      // La liste est légère (sans calques) : on charge le détail à l'ouverture.
      const detailed = await qc.fetchQuery({
        queryKey: ["projects", "detail", project.id],
        queryFn: () => api.projects.get(project.id),
      });
      useEditorStore.getState().openProject(detailed);
    } catch {
      toast.error("Impossible d'ouvrir ce projet");
    }
  }

  function removeProject(id: number) {
    setConfirmId(null);
    deleteProject.mutate(id, {
      onSuccess: () => {
        const { currentProject, setCurrentProject } = useEditorStore.getState();
        if (currentProject?.id === id) setCurrentProject(null);
        toast.success("Projet supprimé");
      },
      onError: () => toast.error("Erreur lors de la suppression"),
    });
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
        Impossible de joindre le serveur.
      </div>
    );
  }

  if (!projects.length) {
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
        <p className="mt-1 text-sm text-zinc-500">{total} projet{total > 1 ? "s" : ""} sauvegardé{total > 1 ? "s" : ""}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {projects.map((project) => {
          const thumbnail = assetUrl(project.thumbnail_url) ?? assetUrl(project.image_url);
          return (
            <div
              key={project.id}
              className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-600"
            >
              {/* Thumbnail */}
              <div className="relative aspect-square overflow-hidden bg-zinc-800">
                {thumbnail ? (
                  <img
                    src={thumbnail}
                    alt={project.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-zinc-800 to-zinc-900">
                    <ImageOff className="h-8 w-8 text-zinc-600" />
                    <span className="text-xs text-zinc-600">Pas d'aperçu</span>
                  </div>
                )}

                {/* Overlay actions */}
                <div
                  className={`absolute inset-0 flex items-center justify-center gap-2 bg-black/60 transition-opacity ${
                    confirmId === project.id ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"
                  }`}
                >
                  {confirmId === project.id ? (
                    <>
                      <span className="text-xs text-zinc-200">Supprimer ?</span>
                      <Button size="icon" variant="destructive" className="h-8 w-8" aria-label="Confirmer la suppression" onClick={() => removeProject(project.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="secondary" className="h-8 w-8" aria-label="Annuler" onClick={() => setConfirmId(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="icon" className="h-8 w-8" aria-label="Ouvrir" onClick={() => openProject(project)}>
                        <FolderOpen className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="destructive" className="h-8 w-8" aria-label="Supprimer" onClick={() => setConfirmId(project.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="truncate text-sm font-medium">{project.title}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-xs text-zinc-500">{formatDate(project.updated_at)}</span>
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
          );
        })}
      </div>

      {hasNextPage && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" disabled={isFetchingNextPage} onClick={() => fetchNextPage()}>
            {isFetchingNextPage ? "Chargement…" : "Voir plus"}
          </Button>
        </div>
      )}
    </div>
  );
}
