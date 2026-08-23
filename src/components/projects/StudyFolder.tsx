import { useState } from "react";
import { Plus } from "lucide-react";
import { AddFolderButton, FolderCard } from "./FolderCard";
import { TopicRow } from "./TopicRow";
import {
  allTopics,
  folder as makeFolder,
  folderProgress,
  topic as makeTopic,
  updateFolderAt,
  type Folder,
  type Project,
} from "./types";

export function StudyFolder({
  path,
  folder,
  update,
  onOpen,
}: {
  /** Cesta ID od korenových složek projektu k této složce. */
  path: string[];
  folder: Folder;
  update: (fn: (p: Project) => Project) => void;
  onOpen: (id: string) => void;
}) {
  const [editId, setEditId] = useState<string | null>(null);

  const patch = (fn: (f: Folder) => Folder) =>
    update((p) => ({ ...p, folders: updateFolderAt(p.folders, path, fn) }));

  const addSubfolder = () => {
    const sub = makeFolder("Nová podsložka");
    patch((f) => ({ ...f, folders: [...f.folders, sub] }));
    setEditId(sub.id);
  };

  const addTopic = () => {
    const t = makeTopic("Nové téma");
    patch((f) => ({ ...f, topics: [...f.topics, t] }));
    setEditId(t.id);
  };

  return (
    <div className="space-y-5">
      {/* Zanořené podsložky — vždy přes tlačítko v záhlaví */}
      <div className="flex justify-end">
        <AddFolderButton label="Nová podsložka" onClick={addSubfolder} />
      </div>
      {folder.folders.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {folder.folders.map((sub) => (
            <FolderCard
              key={sub.id}
              title={sub.title}
              progress={folderProgress(sub)}
              meta={`${sub.folders.length} podsložek · ${allTopics(sub).length} témat`}
              barClass="bg-success"
              autoEdit={editId === sub.id}
              onOpen={() => onOpen(sub.id)}
              onRename={(title) => {
                setEditId(null);
                patch((f) => ({
                  ...f,
                  folders: f.folders.map((x) => (x.id === sub.id ? { ...x, title } : x)),
                }));
              }}
              onDelete={() => patch((f) => ({ ...f, folders: f.folders.filter((x) => x.id !== sub.id) }))}
            />
          ))}
        </div>
      )}

      <div className="space-y-2">
        <p className="font-display text-sm font-bold">Témata</p>

        <ul className="space-y-2">
          {folder.topics.map((t) => (
            <TopicRow
              key={t.id}
              topic={t}
              autoEdit={editId === t.id}
              onRename={(title) =>
                patch((f) => ({
                  ...f,
                  topics: f.topics.map((x) => (x.id === t.id ? { ...x, title } : x)),
                }))
              }
              onDelete={() => patch((f) => ({ ...f, topics: f.topics.filter((x) => x.id !== t.id) }))}
            />
          ))}
        </ul>

        <button
          onClick={addTopic}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" /> Přidat téma
        </button>
      </div>
    </div>
  );
}
