import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Level, Topic } from "./types";
import { getRepetitionStatus } from "@/lib/sm2";

const states: { level: Exclude<Level, "none">; label: string; active: string }[] = [
  {
    level: "hard",
    label: "Těžké",
    active: "border-transparent bg-destructive text-destructive-foreground",
  },
  { level: "medium", label: "Střední", active: "border-transparent bg-warning text-background" },
  {
    level: "easy",
    label: "Snadné",
    active: "border-transparent bg-success text-success-foreground",
  },
];

export function TopicRow({
  topic,
  autoEdit,
  onRename,
  onDelete,
}: {
  topic: Topic;
  autoEdit?: boolean;
  onRename: (title: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(!!autoEdit);
  const [draft, setDraft] = useState(topic.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const repetitionStatus = getRepetitionStatus(topic);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    const next = draft.trim();
    if (next && next !== topic.title) onRename(next);
    else setDraft(topic.title);
    setEditing(false);
  };

  return (
    <li className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl glass-card px-4 py-3">
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
                setDraft(topic.title);
                setEditing(false);
              }
            }}
            className="w-full min-w-0 rounded-lg border border-primary/50 bg-surface-2/60 px-2 py-0.5 text-sm outline-none"
          />
        ) : (
          <>
            <div className="flex items-center gap-2">
              <p className="truncate text-sm">{topic.title}</p>
              {repetitionStatus.badge && (
                <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                  {repetitionStatus.badge}
                </span>
              )}
            </div>
            {repetitionStatus.detail && (
              <p className="mt-0.5 text-[11px] text-muted-foreground">{repetitionStatus.detail}</p>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {states.map((s) => (
          <div
            key={s.level}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-medium",
              topic.level === s.level ? s.active : "border-border text-muted-foreground opacity-40",
            )}
          >
            {s.label}
          </div>
        ))}

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Možnosti tématu"
            className="rounded-lg p-1.5 text-muted-foreground opacity-40 transition-opacity hover:bg-surface-2 hover:text-foreground hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onSelect={() => {
                setDraft(topic.title);
                setEditing(true);
              }}
            >
              <Pencil className="h-4 w-4" /> Upravit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={onDelete}
            >
              <Trash2 className="h-4 w-4" /> Smazat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}
