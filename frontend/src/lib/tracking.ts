import { track } from "@/lib/api";
import { useEditorStore } from "@/stores/editorStore";
import type { TrackedAction } from "@/types";

/** Trace une action d'édition, rattachée au projet ouvert s'il y en a un. */
export function trackEdit(action: TrackedAction, metadata?: Record<string, unknown>) {
  track(action, { projectId: useEditorStore.getState().currentProject?.id, metadata });
}
