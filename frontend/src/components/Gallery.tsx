import { useState } from "react";
import { Trash2, FolderOpen, Clock, Download, ImageOff, Check, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
      <div className="flex flex-1 items-center justify-center bg-ink" role="status" aria-label="Chargement">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-safelight border-t-transparent" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center bg-ink px-6 text-center text-sm text-dim">
        Le serveur ne répond pas. Vos projets s'afficheront dès qu'il sera de nouveau joignable.
      </div>
    );
  }

  if (!projects.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-ink px-6 text-center">
        <ImageOff className="h-10 w-10 text-paper/30" strokeWidth={1.25} />
        <div>
          <p className="text-lg font-semibold">Aucun projet enregistré</p>
          <p className="mt-1 text-sm text-dim">Retouchez une photo puis cliquez sur Enregistrer : elle apparaîtra ici.</p>
        </div>
        <Button onClick={() => useEditorStore.getState().setActiveView("editor")}>Retoucher une photo</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-ink">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Mes projets</h1>
            <p className="mt-1 text-sm text-dim">
              {total} projet{total > 1 ? "s" : ""} enregistré{total > 1 ? "s" : ""}
            </p>
          </div>
          <Button variant="outline" onClick={() => useEditorStore.getState().setActiveView("editor")}>
            Retour à l'éditeur
          </Button>
        </div>

        {/* Planche contact : chaque tirage garde le format de sa publication */}
        <ul className="columns-2 gap-x-5 sm:columns-3 lg:columns-4">
          {projects.map((project) => {
            const thumbnail = assetUrl(project.thumbnail_url) ?? assetUrl(project.image_url);
            const [rw, rh] = (project.settings.aspect_ratio ?? "1:1").split(":").map(Number);
            const confirming = confirmId === project.id;
            return (
              <li key={project.id} className="group mb-6 break-inside-avoid">
                <div className="relative overflow-hidden rounded-[3px] bg-panel" style={{ aspectRatio: `${rw} / ${rh}` }}>
                  {thumbnail ? (
                    <img src={thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageOff className="h-6 w-6 text-paper/30" />
                    </div>
                  )}

                  <div
                    className={`absolute inset-x-0 bottom-0 flex items-center justify-end gap-1.5 bg-gradient-to-t from-ink/90 to-transparent p-2 pt-8 transition-opacity [@media(hover:none)]:opacity-100 ${
                      confirming ? "opacity-100" : "opacity-0 focus-within:opacity-100 group-hover:opacity-100"
                    }`}
                  >
                    {confirming ? (
                      <>
                        <span className="mr-auto pl-1 text-xs font-medium">Supprimer ce projet ?</span>
                        <Button size="icon" variant="destructive" className="h-8 w-8" aria-label="Confirmer la suppression" onClick={() => removeProject(project.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="secondary" className="h-8 w-8" aria-label="Annuler" onClick={() => setConfirmId(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" className="mr-auto h-8" onClick={() => openProject(project)}>
                          <FolderOpen className="h-4 w-4" />
                          Ouvrir
                        </Button>
                        <Button size="icon" variant="secondary" className="h-8 w-8" aria-label={`Supprimer ${project.title}`} onClick={() => setConfirmId(project.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-2.5">
                  <p className="truncate text-sm font-semibold">{project.title}</p>
                  <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-dim">
                    <span>{formatDate(project.updated_at)}</span>
                    {project.editing_time > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(project.editing_time)}
                      </span>
                    )}
                    {project.exports_count > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {project.exports_count} export{project.exports_count > 1 ? "s" : ""}
                      </span>
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        {hasNextPage && (
          <div className="mt-4 flex justify-center">
            <Button variant="outline" disabled={isFetchingNextPage} onClick={() => fetchNextPage()}>
              {isFetchingNextPage ? "Chargement…" : "Afficher plus de projets"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
