import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Brain, ChevronRight, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/app-store";
import {
  PROJECTS_CHANGED_EVENT,
  PROJECTS_STORAGE_KEY,
  parseProjectsSafe,
  writeProjects,
} from "@/lib/projects-storage";
import { ActionFolder } from "./ActionFolder";
import { AddFolderButton, EmptyFolderCard, FolderCard } from "./FolderCard";
import { NewProjectDialog } from "./NewProjectDialog";
import { StudyFolder } from "./StudyFolder";
import {
  allTopics,
  findFolder,
  folder as makeFolder,
  folderProgress,
  projectProgress,
  type Project,
} from "./types";

export function Projects() {
  const { pruneOrphanedSourceTopics } = useAppStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [path, setPath] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [writeAllowed, setWriteAllowed] = useState(false);
  const [hasCorruptedData, setHasCorruptedData] = useState(false);
  const lastWrittenRef = useRef<string>("");

  useEffect(() => {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    const result = parseProjectsSafe(raw);

    setProjects(result.projects);

    if (result.status === "corrupted" && result.raw) {
      // Uložit zálohu
      const backupKey = `${PROJECTS_STORAGE_KEY}-backup-${Date.now()}`;
      localStorage.setItem(backupKey, result.raw);

      // Zablokovat zápis
      setWriteAllowed(false);
      setHasCorruptedData(true);

      console.error("Poškozená data projektů uložena do:", backupKey);
    } else {
      // Prázdné nebo validní → zápis povolen
      setWriteAllowed(true);
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !writeAllowed) return;
    lastWrittenRef.current = JSON.stringify(projects);
    writeProjects(projects);
  }, [projects, hydrated, writeAllowed]);

  useEffect(() => {
    const onChange = () => {
      const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
      if (raw === lastWrittenRef.current) return;
      const result = parseProjectsSafe(raw);
      if (result.status === "valid") {
        lastWrittenRef.current = raw ?? "";
        setProjects(result.projects);
      }
    };
    window.addEventListener(PROJECTS_CHANGED_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(PROJECTS_CHANGED_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const validTopicIds = new Set(
      projects.flatMap((p) =>
        p.kind === "study" ? p.folders.flatMap(allTopics).map((t) => t.id) : [],
      ),
    );
    pruneOrphanedSourceTopics(validTopicIds);
  }, [projects, hydrated, pruneOrphanedSourceTopics]);

  const project = useMemo(
    () => projects.find((p) => p.id === projectId) ?? null,
    [projects, projectId],
  );
  const openFolder = project ? findFolder(project.folders, path) : null;

  /** Popisky složek na cestě pro breadcrumb. */
  const trail = useMemo(() => {
    if (!project) return [];
    return path.map((_, i) => {
      const sub = path.slice(0, i + 1);
      return { path: sub, title: findFolder(project.folders, sub)?.title ?? "…" };
    });
  }, [project, path]);

  const update = (fn: (p: Project) => Project) =>
    setProjects((prev) => prev.map((p) => (p.id === project?.id ? fn(p) : p)));

  const openProject = (id: string) => {
    setProjectId(id);
    setPath([]);
    setEditId(null);
  };

  /** Otevření/zavření složky ukončí rozepsanou editaci názvu. */
  const goTo = (next: string[]) => {
    setPath(next);
    setEditId(null);
  };

  /* ---------- Přehled projektových složek ---------- */
  if (!project) {
    return (
      <div className="space-y-4">
        {hasCorruptedData && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
              <div className="flex-1 space-y-2">
                <p className="font-medium text-destructive">Projektová data byla poškozená</p>
                <p className="text-sm text-muted-foreground">
                  Tvoje projekty nebyly ztraceny, ale změny se dočasně neukládají. Data byla
                  automaticky zálohována. Pokračuj v prohlížení nebo kontaktuj podporu.
                </p>
              </div>
            </div>
          </div>
        )}
        {projects.length === 0 ? (
          <EmptyFolderCard
            label="Nový projekt"
            hint="Založ první projekt — Action pro úkoly, Study pro učení."
            onClick={() => setDialogOpen(true)}
          />
        ) : (
          <>
            <div className="flex justify-end">
              <AddFolderButton label="Nový projekt" onClick={() => setDialogOpen(true)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {projects.map((p) => (
                <FolderCard
                  key={p.id}
                  title={p.name}
                  progress={projectProgress(p)}
                  icon={
                    p.kind === "action" ? (
                      <Rocket className="h-5 w-5 text-primary" />
                    ) : (
                      <Brain className="h-5 w-5 text-focus" />
                    )
                  }
                  barClass={p.color}
                  meta={
                    p.kind === "action"
                      ? `${p.tasks.length} úkolů`
                      : `${p.folders.length} podsložek · ${p.folders.flatMap(allTopics).length} témat`
                  }
                  onOpen={() => openProject(p.id)}
                  onRename={(name) =>
                    setProjects((prev) => prev.map((x) => (x.id === p.id ? { ...x, name } : x)))
                  }
                  onDelete={() => setProjects((prev) => prev.filter((x) => x.id !== p.id))}
                />
              ))}
            </div>
          </>
        )}

        <NewProjectDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onCreate={(p) => {
            setProjects((prev) => [...prev, p]);
            openProject(p.id);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <button
          onClick={() => {
            setProjectId(null);
            goTo([]);
          }}
          className="rounded-lg px-2 py-1 transition-colors hover:bg-surface-2 hover:text-foreground"
        >
          Moje projekty
        </button>
        <ChevronRight className="h-3.5 w-3.5" />
        <button
          onClick={() => goTo([])}
          className={cn(
            "rounded-lg px-2 py-1 transition-colors hover:bg-surface-2 hover:text-foreground",
            !openFolder && "text-foreground",
          )}
        >
          {project.name}
        </button>
        {trail.map((step, i) => (
          <span key={step.path.join("/")} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5" />
            <button
              onClick={() => goTo(step.path)}
              className={cn(
                "rounded-lg px-2 py-1 transition-colors hover:bg-surface-2 hover:text-foreground",
                i === trail.length - 1 && "text-foreground",
              )}
            >
              {step.title}
            </button>
          </span>
        ))}
      </nav>

      {/* Obsah složky */}
      {project.kind === "action" ? (
        <ActionFolder key={project.id} project={project} update={update} />
      ) : openFolder ? (
        <StudyFolder
          key={openFolder.id}
          path={path}
          folder={openFolder}
          update={update}
          onOpen={(id) => goTo([...path, id])}
        />
      ) : (
        <>
          <div className="flex justify-end">
            <AddFolderButton
              label="Nová podsložka"
              onClick={() => {
                const f = makeFolder("Nová podsložka");
                update((p) => ({ ...p, folders: [...p.folders, f] }));
                setEditId(f.id);
              }}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {project.folders.map((f) => (
              <FolderCard
                key={f.id}
                title={f.title}
                progress={folderProgress(f)}
                barClass="bg-success"
                autoEdit={editId === f.id}
                meta={`${f.folders.length} podsložek · ${allTopics(f).length} témat`}
                onOpen={() => goTo([f.id])}
                onRename={(title) => {
                  setEditId(null);
                  update((p) => ({
                    ...p,
                    folders: p.folders.map((x) => (x.id === f.id ? { ...x, title } : x)),
                  }));
                }}
                onDelete={() =>
                  update((p) => ({ ...p, folders: p.folders.filter((x) => x.id !== f.id) }))
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
