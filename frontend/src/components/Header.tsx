import { Undo2, Redo2, Download, Save, LayoutGrid, BarChart3, SlidersHorizontal, Crop } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useEditorStore } from "@/stores/editorStore";
import { useCanvas } from "@/hooks/useCanvas";
import { useSaveProject } from "@/hooks/useProjects";
import { serializeLayers } from "@/lib/layers";
import { canvasThumbnail } from "@/lib/scene";
import { cn } from "@/lib/utils";
import type { AppView, ProjectInput } from "@/types";
import { toast } from "sonner";

const VIEWS: { id: AppView; label: string; icon: React.ElementType }[] = [
  { id: "editor", label: "Éditeur", icon: Crop },
  { id: "gallery", label: "Mes projets", icon: LayoutGrid },
  { id: "dashboard", label: "Statistiques", icon: BarChart3 },
];

export function Header({ onTogglePanel }: { onTogglePanel: () => void }) {
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
  const inEditor = activeView === "editor";

  async function handleSave() {
    const s = useEditorStore.getState();
    if (!s.canvas || !s.imageLoaded || !s.imageUrl) return;

    try {
      const input: ProjectInput = {
        title: s.projectTitle.trim() || "Sans titre",
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
      toast.success(s.currentProject ? "Modifications enregistrées" : "Projet enregistré dans Mes projets");
    } catch {
      toast.error("Le projet n'a pas pu être enregistré. Vérifiez votre connexion et réessayez.");
    }
  }

  return (
    <header className="z-20 flex h-14 shrink-0 items-center gap-2 border-b border-line bg-ink px-2 sm:gap-3 sm:px-4">
      {/* Marque */}
      <div className="flex shrink-0 items-center gap-2 pr-1">
        <img src="/icon.svg" alt="" className="h-7 w-7" />
        <span className="hidden text-[15px] font-extrabold tracking-tight md:inline">PixelCraft</span>
      </div>

      {/* Vues */}
      <nav aria-label="Vues" className="flex h-full shrink-0 items-stretch">
        {VIEWS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveView(id)}
            aria-current={activeView === id ? "page" : undefined}
            aria-label={label}
            className={cn(
              "relative flex items-center gap-2 px-2.5 text-sm transition-colors sm:px-3",
              activeView === id ? "text-paper" : "text-dim hover:text-paper",
              activeView === id && "after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-safelight"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden lg:inline">{label}</span>
          </button>
        ))}
      </nav>

      {/* Titre du projet */}
      {inEditor ? (
        <input
          value={projectTitle}
          onChange={(e) => setProjectTitle(e.target.value)}
          aria-label="Nom du projet"
          placeholder="Nom du projet"
          className="ml-1 min-w-0 flex-1 truncate rounded border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-paper placeholder:text-dim hover:border-line focus:border-line sm:max-w-xs"
        />
      ) : (
        <div className="flex-1" />
      )}

      {inEditor && (
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <div className="hidden items-center sm:flex">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Annuler" disabled={!canUndo} onClick={undo}>
                  <Undo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Annuler · Ctrl+Z</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Rétablir" disabled={!canRedo} onClick={redo}>
                  <Redo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rétablir · Ctrl+Y</TooltipContent>
            </Tooltip>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Réglages de l'image"
            disabled={!imageLoaded}
            onClick={onTogglePanel}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            aria-label="Enregistrer"
            disabled={!imageLoaded || saveProject.isPending}
            onClick={handleSave}
          >
            <Save className="h-4 w-4" />
            <span className="hidden md:inline">{saveProject.isPending ? "Enregistrement…" : "Enregistrer"}</span>
          </Button>

          <Button size="sm" aria-label="Exporter en PNG" disabled={!imageLoaded} onClick={exportPNG}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exporter</span>
          </Button>
        </div>
      )}
    </header>
  );
}
