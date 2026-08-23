import { useEffect, useRef, useState } from "react";
import { Check, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Task } from "./types";

export function TaskRow({
  task,
  autoEdit,
  onToggle,
  onRename,
  onDelete,
}: {
  task: Task;
  autoEdit?: boolean;
  onToggle: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(!!autoEdit);
  const [draft, setDraft] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    const next = draft.trim();
    if (next && next !== task.title) onRename(next);
    else setDraft(task.title);
    setEditing(false);
  };

  return (
    <li className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl glass-card px-4 py-3">
      <button
        onClick={onToggle}
        aria-label={task.done ? "Označit jako nesplněné" : "Označit jako splněné"}
        className={cn(
          "grid h-4 w-4 place-items-center rounded-md border border-input transition-colors",
          task.done && "border-success bg-success/20",
        )}
      >
        {task.done && <Check className="h-3 w-3 text-success" />}
      </button>

      <div className="min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setDraft(task.title);
                setEditing(false);
              }
            }}
            className="w-full min-w-0 rounded-lg border border-primary/50 bg-surface-2/60 px-2 py-0.5 text-sm outline-none"
          />
        ) : (
          <p className={cn("truncate text-sm", task.done && "text-muted-foreground line-through")}>
            {task.title}
          </p>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Možnosti úkolu"
          className="rounded-lg p-1.5 text-muted-foreground opacity-40 transition-opacity hover:bg-surface-2 hover:text-foreground hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100"
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onSelect={() => {
              setDraft(task.title);
              setEditing(true);
            }}
          >
            <Pencil className="h-4 w-4" /> Upravit
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={onDelete}>
            <Trash2 className="h-4 w-4" /> Smazat
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
