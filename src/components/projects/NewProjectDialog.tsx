import { useState } from "react";
import { Brain, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { type Project, type ProjectKind } from "./types";

const kinds = [
  {
    id: "action" as const,
    icon: Rocket,
    title: "🚀 Action Project",
    desc: "Jednorázový projekt na tvorbu či dokončení — vývoj webu, semestrální práce.",
  },
  {
    id: "study" as const,
    icon: Brain,
    title: "🧠 Study Project",
    desc: "Opakovací a učící projekt — test z fyziky, maturita, slovíčka.",
  },
];

export function NewProjectDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (p: Project) => void;
}) {
  const [kind, setKind] = useState<ProjectKind>("action");
  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState("");

  const create = () => {
    onCreate({
      id: crypto.randomUUID(),
      kind,
      name: name.trim() || (kind === "action" ? "Nový projekt" : "Nové učení"),
      goal: "",
      deadline,
      color: kind === "action" ? "bg-primary" : "bg-focus",
      tasks: [],
      folders: [],
    });
    setName("");
    setDeadline("");
    setKind("action");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display">Nový projekt</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Typ projektu">
            {kinds.map((k) => (
              <button
                key={k.id}
                type="button"
                role="radio"
                aria-checked={kind === k.id}
                onClick={() => setKind(k.id)}
                className={cn(
                  "rounded-2xl border border-border bg-surface-2/40 p-3 text-left transition-colors",
                  kind === k.id ? "border-primary/50 bg-surface-2" : "hover:bg-surface-2/70",
                )}
              >
                <p className="text-sm font-semibold">{k.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{k.desc}</p>
              </button>
            ))}
          </div>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Název projektu"
            placeholder="Název projektu *"
            className="w-full rounded-2xl border border-border bg-surface-2/40 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50"
          />

          <label className="flex items-center gap-3 rounded-2xl border border-border bg-surface-2/40 px-4 py-3 text-sm">
            <span className="text-muted-foreground">Cílový termín</span>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="ml-auto bg-transparent text-sm outline-none"
            />
          </label>

          <Button className="w-full rounded-full" onClick={create} disabled={!name.trim()}>
            Vytvořit projekt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
