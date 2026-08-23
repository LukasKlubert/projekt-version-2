import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Level } from "@/components/projects/types";

const grades: { level: Exclude<Level, "none">; label: string; color: string }[] = [
  { level: "hard", label: "Těžké", color: "bg-destructive text-destructive-foreground hover:bg-destructive/90" },
  { level: "medium", label: "Střední", color: "bg-warning text-background hover:bg-warning/90" },
  { level: "easy", label: "Snadné", color: "bg-success text-success-foreground hover:bg-success/90" },
];

export function GradeModal({
  topicTitle,
  onGrade,
  onClose,
}: {
  topicTitle: string;
  onGrade: (grade: Exclude<Level, "none">) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl glass-card p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg font-bold">Jak ti šlo opakování?</h3>
            <p className="mt-1 truncate text-sm text-muted-foreground">{topicTitle}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Zavřít"
            className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          {grades.map((g) => (
            <button
              key={g.level}
              onClick={() => onGrade(g.level)}
              className={cn(
                "rounded-2xl px-4 py-3 font-medium transition-colors",
                g.color,
              )}
            >
              {g.label}
            </button>
          ))}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Toto nastaví postup tématu a naplánuje příští opakování
        </p>
      </div>
    </div>
  );
}
