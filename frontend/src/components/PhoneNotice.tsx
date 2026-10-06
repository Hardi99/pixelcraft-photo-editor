import { Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/stores/editorStore";

/** Remplace l'éditeur sur téléphone : un message clair plutôt qu'une interface inutilisable. */
export function PhoneNotice() {
  const setActiveView = useEditorStore((s) => s.setActiveView);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5 bg-ink px-8 text-center">
      <Monitor className="h-10 w-10 text-safelight" strokeWidth={1.5} />
      <div>
        <h1 className="text-xl font-bold">PixelCraft s'utilise sur ordinateur ou tablette</h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-dim">
          L'éditeur a besoin d'un écran d'au moins 900 pixels de large. Vous pouvez quand même consulter vos projets
          et les statistiques.
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setActiveView("gallery")}>Mes projets</Button>
        <Button variant="outline" onClick={() => setActiveView("dashboard")}>Statistiques</Button>
      </div>
    </main>
  );
}
