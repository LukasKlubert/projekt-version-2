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

/** Bezpečné parsování projektových dat s rozlišením empty/valid/corrupted. */
export function parseProjectsSafe(raw: string | null): {
  projects: Project[];
  status: "empty" | "valid" | "corrupted";
  raw?: string;
} {
  // Chybí klíč → legitimní prázdno
  if (!raw) return { projects: [], status: "empty" };

  try {
    const parsed = JSON.parse(raw);
    const normalized = normalizeProjects(parsed);

    // Validace: musí být pole
    if (!Array.isArray(parsed)) {
      return { projects: [], status: "corrupted", raw };
    }

    // Validace: každý projekt musí mít id, name, kind
    const allValid = normalized.every(
      (p) =>
        typeof p.id === "string" &&
        p.id.length > 0 &&
        typeof p.name === "string" &&
        (p.kind === "action" || p.kind === "study"),
    );

    if (!allValid) {
      return { projects: [], status: "corrupted", raw };
    }

    return { projects: normalized, status: "valid" };
  } catch {
    // Parse error nebo normalize error
    return { projects: [], status: "corrupted", raw };
  }
}

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
