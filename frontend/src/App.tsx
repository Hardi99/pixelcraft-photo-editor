import { TooltipProvider } from "@/components/ui/tooltip";
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

export default function App() {
  const { activeView } = useEditorStore();

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen flex-col overflow-hidden bg-zinc-950 text-zinc-100">
        <Header />

        <div className={`flex flex-1 overflow-hidden ${activeView !== "editor" ? "hidden" : ""}`}>
          <LeftSidebar />

          <div className="flex flex-1 flex-col overflow-hidden">
            <TextToolbar />
            <Canvas />
            <FilterPresets />
          </div>

          <RightSidebar />
        </div>

        <div className={`flex flex-1 overflow-hidden ${activeView !== "gallery" ? "hidden" : ""}`}>
          <Gallery />
        </div>

        <div className={`flex flex-1 overflow-hidden ${activeView !== "dashboard" ? "hidden" : ""}`}>
          <KPIDashboard />
        </div>

        <AssistantBot />
      </div>
    </TooltipProvider>
  );
}
