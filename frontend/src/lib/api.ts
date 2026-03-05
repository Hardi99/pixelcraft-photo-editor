import type { Project, Stats } from "@/types";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `API ${res.status}`);
  }
  return res.json();
}

export const api = {
  projects: {
    list: () => request<Project[]>("/api/v1/projects"),
    get: (id: number) => request<Project>(`/api/v1/projects/${id}`),
    create: (data: FormData) =>
      request<Project>("/api/v1/projects", { method: "POST", body: data }),
    update: (id: number, data: Partial<Project> & { image?: File }) => {
      // If we have an image, use FormData; otherwise JSON
      if (data.image) {
        const fd = new FormData();
        fd.append("image", data.image);
        if (data.layers_json) fd.append("project[layers_json]", data.layers_json);
        if (data.editing_time !== undefined)
          fd.append("project[editing_time]", String(data.editing_time));
        if (data.exports_count !== undefined)
          fd.append("project[exports_count]", String(data.exports_count));
        return request<Project>(`/api/v1/projects/${id}`, { method: "PATCH", body: fd });
      }
      return request<Project>(`/api/v1/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: data }),
      });
    },
    delete: (id: number) =>
      request<void>(`/api/v1/projects/${id}`, { method: "DELETE" }),
  },
  stats: () => request<Stats>("/api/v1/stats"),
  track: (action_name: string, metadata?: Record<string, unknown>) =>
    request<void>("/api/v1/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: { action_name, metadata } }),
    }),
};
