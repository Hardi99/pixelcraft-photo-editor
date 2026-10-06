import { useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { Header } from "@/components/Header";
import { Canvas } from "@/components/Editor/Canvas";
import { TextToolbar } from "@/components/Editor/TextToolbar";
import { FilterPresets } from "@/components/Editor/FilterPresets";
import { LeftSidebar } from "@/components/Sidebar/LeftSidebar";
import { RightSidebar } from "@/components/Sidebar/RightSidebar";
import { Gallery } from "@/components/Gallery";
import { KPIDashboard } from "@/components/KPIDashboard";
import { AssistantBot } from "@/components/AssistantBot";
import { useEditorStore } from "@/stores/editorStore";
import { cn } from "@/lib/utils";

export default function App() {
  const activeView = useEditorStore((s) => s.activeView);
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-dvh flex-col overflow-hidden bg-ink text-paper">
        <Header onTogglePanel={() => setPanelOpen((open) => !open)} />

        {/* L'éditeur reste monté (masqué) pour conserver le canvas Fabric entre les vues */}
        <main className={cn("relative flex min-h-0 flex-1", activeView !== "editor" && "hidden")}>
          <LeftSidebar />

          <div className="relative flex min-w-0 flex-1 flex-col">
            <div className="relative flex min-h-0 flex-1">
              <TextToolbar />
              <Canvas />
              <AssistantBot />
            </div>
            <FilterPresets />
          </div>

          {/* Réglages : colonne fixe sur grand écran, panneau superposé en dessous */}
          {panelOpen && (
            <button
              aria-label="Fermer les réglages"
              className="absolute inset-0 z-30 bg-ink/60 lg:hidden"
              onClick={() => setPanelOpen(false)}
            />
          )}
          <div
            className={cn(
              "absolute inset-y-0 right-0 z-40 transition-transform lg:static lg:z-auto lg:translate-x-0",
              panelOpen ? "visible translate-x-0" : "invisible translate-x-full lg:visible"
            )}
          >
            <RightSidebar />
          </div>
        </main>

        {activeView === "gallery" && <Gallery />}
        {activeView === "dashboard" && <KPIDashboard />}

        <Toaster
          theme="dark"
          position="bottom-center"
          toastOptions={{ style: { background: "hsl(var(--paper))", color: "hsl(var(--ink))", border: "none" } }}
        />
      </div>
    </TooltipProvider>
  );
}
