import { useEffect, useRef, useState, type ReactNode } from "react";
import { Folder as FolderIcon, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ProgressBar } from "./ProgressBar";

export function FolderCard({
  title,
  progress,
  meta,
  icon,
  iconClass,
  barClass,
  autoEdit,
  onOpen,
  onRename,
  onDelete,
}: {
  title: string;
  progress: number;
  meta: string;
  icon?: ReactNode;
  iconClass?: string;
  barClass?: string;
  /** Nová složka — rovnou otevři přejmenování. */
  autoEdit?: boolean;
  onOpen: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(!!autoEdit);
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    const next = draft.trim();
    if (next && next !== title) onRename(next);
    else setDraft(title);
    setEditing(false);
  };

  return (
    <div className="group relative rounded-3xl glass-card p-4 transition-colors hover:bg-surface-2/40">
      <div className="absolute right-2 top-2 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Možnosti složky"
            className="rounded-lg p-1.5 text-muted-foreground opacity-40 transition-opacity hover:bg-surface-2 hover:text-foreground hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onSelect={() => {
                setDraft(title);
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

      <button onClick={onOpen} disabled={editing} className="w-full text-left">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 pr-7">
          {icon ?? <FolderIcon className={cn("h-5 w-5 text-focus", iconClass)} />}
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") {
                  setDraft(title);
                  setEditing(false);
                }
              }}
              className="min-w-0 rounded-lg border border-primary/50 bg-surface-2/60 px-2 py-0.5 font-display text-sm font-bold outline-none"
            />
          ) : (
            <span className="truncate font-display text-sm font-bold">{title}</span>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1">
            <ProgressBar value={progress} className={barClass} />
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">{progress} %</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{meta}</p>
      </button>
    </div>
  );
}

/** Kompaktní tlačítko v záhlaví — používá se, když už nějaké složky existují. */
export function AddFolderButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
    >
      <Plus className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

/** Velká výzva k akci — zobrazí se, dokud je složka prázdná. */
export function EmptyFolderCard({
  label,
  hint,
  onClick,
}: {
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="grid min-h-[180px] w-full place-items-center rounded-3xl border border-dashed border-input p-8 text-center transition-colors hover:border-primary/60"
    >
      <div className="space-y-2">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-surface-2 text-primary">
          <Plus className="h-6 w-6" />
        </span>
        <p className="font-display text-base font-bold">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </button>
  );
}
