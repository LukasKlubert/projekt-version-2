import { normalizeTopic, type Folder, type Project } from "@/components/projects/types";

export const PROJECTS_STORAGE_KEY = "fokus-projects-v2";
export const PROJECTS_CHANGED_EVENT = "fokus-projects-changed";

const normalizeFolder = (f: Folder): Folder => ({
  ...f,
  topics: (f.topics ?? []).map((t) => normalizeTopic(t)),
  folders: (f.folders ?? []).map(normalizeFolder),
});

export const normalizeProjects = (raw: unknown): Project[] =>
  (Array.isArray(raw) ? (raw as Project[]) : []).map((p) => ({
    ...p,
    tasks: p.tasks ?? [],
    folders: (p.folders ?? []).map(normalizeFolder),
  }));

/** Načte a normalizuje projekty z localStorage. */
export function readProjects(): Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) return [];
    return normalizeProjects(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function writeProjects(projects: Project[]) {
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  window.dispatchEvent(new Event(PROJECTS_CHANGED_EVENT));
}
