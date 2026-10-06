import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import { useEditorStore } from "./stores/editorStore";

// Point d'accès pour les tests de bout en bout (Playwright) : absent du build de production.
if (import.meta.env.DEV) {
  (window as unknown as { __pixelcraft: unknown }).__pixelcraft = { store: useEditorStore };
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
