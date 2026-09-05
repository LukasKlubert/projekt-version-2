import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Level } from "@/components/projects/types";

const grades: { level: Exclude<Level, "none">; label: string; color: string }[] = [
  {
    level: "hard",
    label: "Těžké",
    color: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  },
  { level: "medium", label: "Střední", color: "bg-warning text-background hover:bg-warning/90" },
  {
    level: "easy",
    label: "Snadné",
    color: "bg-success text-success-foreground hover:bg-success/90",
  },
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
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-full max-w-md rounded-3xl glass-card p-6">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            Jak ti šlo opakování?
          </DialogTitle>
          <p className="mt-1 truncate text-sm text-muted-foreground">{topicTitle}</p>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {grades.map((g) => (
            <button
              key={g.level}
              type="button"
              onClick={() => onGrade(g.level)}
              className={cn("rounded-2xl px-4 py-3 font-medium transition-colors", g.color)}
            >
              {g.label}
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Toto nastaví postup tématu a naplánuje příští opakování
        </p>
      </DialogContent>
    </Dialog>
  );
}
