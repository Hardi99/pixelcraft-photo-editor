import type { Project, ProjectInput, ProjectPage, Stats, TrackedAction } from "@/types";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
const TOKEN_KEY = "pixelcraft.visitorToken";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Jeton anonyme : créé au premier appel, gardé dans le navigateur, envoyé
// en Authorization sur chaque requête. Le backend ne renvoie que ses projets.
let tokenPromise: Promise<string> | null = null;

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function getToken(): Promise<string> {
  tokenPromise ??= (async () => {
    const stored = readStoredToken();
    if (stored) return stored;
    const { token } = await send<{ token: string }>("/api/v1/visitors", { method: "POST" });
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Stockage indisponible (navigation privée) : le jeton vit le temps de l'onglet.
    }
    return token;
  })();
  return tokenPromise;
}

async function send<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body?.error ?? `API ${res.status}`);
  }
  const text = await res.text(); // 201/204 sans corps (events, delete)
  return (text ? JSON.parse(text) : undefined) as T;
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${await getToken()}`);
  try {
    return await send<T>(path, { ...init, headers });
  } catch (error) {
    // Jeton révoqué ou base réinitialisée : on en redemande un, une seule fois.
    if (retry && error instanceof ApiError && error.status === 401) {
      tokenPromise = null;
      try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
      return request<T>(path, init, false);
    }
    throw error;
  }
}

function toFormData(input: ProjectInput): FormData {
  const form = new FormData();
  if (input.title !== undefined) form.append("project[title]", input.title);
  if (input.image) form.append("project[image]", input.image, "image");
  if (input.thumbnail) form.append("project[thumbnail]", input.thumbnail, "thumbnail.jpg");
  if (input.layers) form.append("project[layers]", JSON.stringify(input.layers));
  if (input.settings) form.append("project[settings]", JSON.stringify(input.settings));
  if (input.editingSeconds) form.append("editing_seconds", String(input.editingSeconds));
  return form;
}

/** Les URLs ActiveStorage sont relatives au backend. */
export function assetUrl(path: string | null): string | null {
  return path ? `${BASE}${path}` : null;
}

export const api = {
  projects: {
    list: (page = 1) => request<ProjectPage>(`/api/v1/projects?page=${page}`),
    get: (id: number) => request<Project>(`/api/v1/projects/${id}`),
    create: (input: ProjectInput) =>
      request<Project>("/api/v1/projects", { method: "POST", body: toFormData(input) }),
    update: (id: number, input: ProjectInput) =>
      request<Project>(`/api/v1/projects/${id}`, { method: "PATCH", body: toFormData(input) }),
    delete: (id: number) => request<void>(`/api/v1/projects/${id}`, { method: "DELETE" }),
    export: (id: number, details: { target: string; format: string }) =>
      request<Project>(`/api/v1/projects/${id}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // params[:format] est réservé par Rails : le type de fichier voyage en file_type
        body: JSON.stringify({ target: details.target, file_type: details.format }),
      }),
  },
  stats: () => send<Stats>("/api/v1/stats"),
};

/** Tracking « fire and forget » : une panne d'API ne doit jamais casser l'éditeur. */
export function track(action: TrackedAction, options: { projectId?: number; metadata?: Record<string, unknown> } = {}) {
  request<void>("/api/v1/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: { action_name: action, project_id: options.projectId, metadata: options.metadata },
    }),
  }).catch(() => {});
}
