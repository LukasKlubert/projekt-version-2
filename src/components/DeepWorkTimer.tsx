import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { isValidCustomPresetMinutes, useAppStore } from "@/lib/app-store";
import { cn } from "@/lib/utils";
import {
  Pause,
  Play,
  RotateCcw,
  Waves,
  CloudRain,
  Coffee,
  VolumeX,
  Plus,
  Check,
  X,
} from "lucide-react";

const AMBIENT_SOUNDS_ENABLED = false; // Skryto v rámci "Dotažení první verze" — reálné přehrávání zatím neexistuje, viz .cursor/plans/dotazeni_prvni_verze.plan.md

const presets = [
  { label: "25 min", minutes: 25 },
  { label: "50 min", minutes: 50 },
  { label: "90 min", minutes: 90 },
];

const sounds = [
  { id: "none", label: "Ticho", icon: VolumeX },
  { id: "rain", label: "Déšť", icon: CloudRain },
  { id: "waves", label: "Moře", icon: Waves },
  { id: "cafe", label: "Kavárna", icon: Coffee },
];

function snapPresetMinutes(raw: number): number {
  const clamped = Math.min(180, Math.max(5, raw));
  return Math.round(clamped / 5) * 5;
}

/* eslint-disable react-refresh/only-export-components -- tickTimer je čistá funkce pro testy */
/** Odečte jednu sekundu; dokončení jen při přechodu z 1 s na 0. */
export function tickTimer(remaining: number): { remaining: number; justCompleted: boolean } {
  if (remaining <= 0) return { remaining: 0, justCompleted: false };
  if (remaining <= 1) return { remaining: 0, justCompleted: true };
  return { remaining: remaining - 1, justCompleted: false };
}

function CustomPresetChip({
  minutes,
  selected,
  onSelect,
  onRemove,
}: {
  minutes: number;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const [holding, setHolding] = useState(false);
  const [phase, setPhase] = useState<"idle" | "pulse" | "out">("idle");
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const outTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressClick = useRef(false);

  const clearHoldTimer = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    setHolding(false);
  };

  const handlePointerDown = () => {
    if (phase !== "idle") return;
    setHolding(true);
    holdTimer.current = setTimeout(() => {
      suppressClick.current = true;
      setHolding(false);
      setPhase("pulse");
      pulseTimer.current = setTimeout(() => {
        setPhase("out");
        outTimer.current = setTimeout(() => {
          onRemove();
        }, 150);
      }, 100);
    }, 600);
  };

  const handlePointerEnd = () => {
    if (phase !== "idle") return;
    clearHoldTimer();
  };

  useEffect(() => {
    return () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
      if (pulseTimer.current) clearTimeout(pulseTimer.current);
      if (outTimer.current) clearTimeout(outTimer.current);
    };
  }, []);

  return (
    <div
      className={cn(
        "relative select-none touch-none transition-[opacity,transform]",
        phase === "pulse" && "scale-95 duration-100",
        phase === "out" && "scale-90 opacity-0 duration-150",
        phase === "idle" && "duration-150",
      )}
    >
      <button
        type="button"
        onClick={() => {
          if (suppressClick.current) {
            suppressClick.current = false;
            return;
          }
          onSelect();
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onContextMenu={(e) => e.preventDefault()}
        className={cn(
          "relative overflow-hidden rounded-full border border-dashed border-border px-4 py-1.5 text-sm transition-colors select-none touch-none",
          selected
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <span
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 bg-gradient-to-r from-destructive/25 to-destructive/60 transition-[width] ease-linear",
            holding ? "w-full duration-[600ms]" : "w-0 duration-150",
          )}
        />
        <span className="relative">{minutes} min</span>
      </button>
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        aria-label={`Smazat předvolbu ${minutes} min`}
        title={`Smazat předvolbu ${minutes} min`}
        className="absolute -top-1 -right-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-surface-2 text-[9px] leading-none text-muted-foreground"
      >
        ×
      </button>
    </div>
  );
}

export function DeepWorkTimer() {
  const {
    timerOpen,
    setTimerOpen,
    activeTaskTitle,
    addFocusMinutes,
    customPresets,
    addCustomPreset,
    removeCustomPreset,
  } = useAppStore();
  const [minutes, setMinutes] = useState(50);
  const [remaining, setRemaining] = useState(50 * 60);
  const [running, setRunning] = useState(false);
  const [sound, setSound] = useState("rain");
  const [addingCustom, setAddingCustom] = useState(false);
  const [customDraft, setCustomDraft] = useState("");
  const addGroupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (timerOpen) {
      setRemaining(minutes * 60);
      setRunning(true);
    } else {
      setRunning(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerOpen]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => tickTimer(r).remaining);
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (remaining !== 0 || !running) return;
    setRunning(false);
    addFocusMinutes(minutes);
  }, [remaining, running, minutes, addFocusMinutes]);

  const total = minutes * 60;
  const progress = useMemo(() => 1 - remaining / total, [remaining, total]);
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  const R = 132;
  const C = 2 * Math.PI * R;

  const applyPreset = (value: number) => {
    setMinutes(value);
    setRemaining(value * 60);
  };

  const cancelAdding = () => {
    setAddingCustom(false);
    setCustomDraft("");
  };

  const confirmAdding = () => {
    const raw = Number(customDraft);
    if (!Number.isFinite(raw) || raw === 0) {
      cancelAdding();
      return;
    }
    const snapped = snapPresetMinutes(raw);
    if (!isValidCustomPresetMinutes(snapped)) {
      cancelAdding();
      return;
    }
    addCustomPreset(snapped);
    applyPreset(snapped);
    cancelAdding();
  };

  return (
    <Dialog open={timerOpen} onOpenChange={setTimerOpen}>
      <DialogContent className="max-w-full border-none bg-background/95 p-0 sm:max-w-full h-[100dvh] w-screen rounded-none backdrop-blur-2xl">
        <div className="flex h-full flex-col items-center justify-center gap-8 px-6 py-10">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-primary">Deep Work</p>
            <h2 className="mt-2 max-w-xl text-balance text-xl font-bold md:text-2xl">
              {activeTaskTitle ?? "Hluboká práce bez rozptýlení"}
            </h2>
          </div>

          <div className="relative grid place-items-center">
            <svg width="300" height="300" viewBox="0 0 300 300" className="-rotate-90">
              <circle
                cx="150"
                cy="150"
                r={R}
                className="fill-none stroke-surface-2"
                strokeWidth="10"
              />
              <circle
                cx="150"
                cy="150"
                r={R}
                className="fill-none stroke-primary transition-[stroke-dashoffset] duration-1000 ease-linear"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - progress)}
                style={{
                  filter:
                    "drop-shadow(0 0 12px color-mix(in oklab, var(--primary) 75%, transparent))",
                }}
              />
            </svg>
            <div className="absolute text-center">
              <p className="font-display text-6xl font-bold tabular-nums">
                {mm}:{ss}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {running ? "Soustředění běží" : remaining === 0 ? "Hotovo 🎉" : "Pauza"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {presets.map((p) => (
              <button
                key={p.minutes}
                type="button"
                onClick={() => applyPreset(p.minutes)}
                className={cn(
                  "rounded-full border border-border px-4 py-1.5 text-sm transition-colors",
                  minutes === p.minutes
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {p.label}
              </button>
            ))}
            {customPresets.map((value) => (
              <CustomPresetChip
                key={value}
                minutes={value}
                selected={minutes === value}
                onSelect={() => applyPreset(value)}
                onRemove={() => removeCustomPreset(value)}
              />
            ))}
            {addingCustom ? (
              <div
                ref={addGroupRef}
                className="flex w-[120px] items-center gap-1 rounded-full border border-dashed border-border px-2 py-1.5"
                onBlur={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
                  cancelAdding();
                }}
              >
                <input
                  type="number"
                  inputMode="numeric"
                  min={5}
                  max={180}
                  step={5}
                  placeholder="min"
                  autoFocus
                  value={customDraft}
                  onChange={(e) => setCustomDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      confirmAdding();
                    }
                    if (e.key === "Escape") {
                      e.preventDefault();
                      cancelAdding();
                    }
                  }}
                  className="min-w-0 flex-1 appearance-none bg-transparent text-sm outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  aria-label="Vlastní délka v minutách"
                />
                <div className="flex gap-1">
                  <button
                    type="button"
                    aria-label="Potvrdit předvolbu"
                    title="Potvrdit předvolbu"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={confirmAdding}
                    className="grid place-items-center"
                  >
                    <Check className="h-3.5 w-3.5 text-success" />
                  </button>
                  <button
                    type="button"
                    aria-label="Zrušit"
                    title="Zrušit"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={cancelAdding}
                    className="grid place-items-center"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingCustom(true)}
                aria-label="Přidat vlastní předvolbu"
                title="Přidat vlastní předvolbu"
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                Vlastní
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="lg"
              className="rounded-full px-8 pulse-glow"
              onClick={() => setRunning((r) => !r)}
            >
              {running ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              {running ? "Pauza" : "Pokračovat"}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full"
              aria-label="Restartovat časovač"
              title="Restartovat časovač"
              onClick={() => {
                setRemaining(minutes * 60);
                setRunning(false);
              }}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {AMBIENT_SOUNDS_ENABLED && (
            <div className="w-full max-w-md">
              <p className="mb-2 text-center text-xs uppercase tracking-widest text-muted-foreground">
                Ambientní zvuk
              </p>
              <div className="grid grid-cols-4 gap-2">
                {sounds.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSound(s.id)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-2xl border border-border px-2 py-3 text-[11px] transition-colors",
                      sound === s.id
                        ? "bg-surface-2 text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <s.icon className="h-4 w-4" />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
