import { useState } from "react";
import { Plus } from "lucide-react";
import { TaskRow } from "./TaskRow";
import { task as makeTask, type Project } from "./types";

export function ActionFolder({
  project,
  update,
}: {
  project: Project;
  update: (fn: (p: Project) => Project) => void;
}) {
  const [editId, setEditId] = useState<string | null>(null);

  const addTask = () => {
    const t = makeTask("Nový úkol", 30);
    update((p) => ({ ...p, tasks: [...p.tasks, t] }));
    setEditId(t.id);
  };

  return (
    <div className="space-y-2">
      <p className="font-display text-sm font-bold">Úkoly</p>

      <ul className="space-y-2">
        {project.tasks.map((t) => (
          <TaskRow
            key={t.id}
            task={t}
            autoEdit={editId === t.id}
            onToggle={() =>
              update((p) => ({
                ...p,
                tasks: p.tasks.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)),
              }))
            }
            onRename={(title) => {
              setEditId(null);
              update((p) => ({
                ...p,
                tasks: p.tasks.map((x) => (x.id === t.id ? { ...x, title } : x)),
              }));
            }}
            onDelete={() => update((p) => ({ ...p, tasks: p.tasks.filter((x) => x.id !== t.id) }))}
          />
        ))}
      </ul>

      <button
        onClick={addTask}
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" /> Přidat úkol
      </button>
    </div>
  );
}
