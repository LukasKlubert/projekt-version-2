import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/app-store";
import { cn } from "@/lib/utils";
import { Pause, Play, RotateCcw, Waves, CloudRain, Coffee, VolumeX } from "lucide-react";

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

export function DeepWorkTimer() {
  const { timerOpen, setTimerOpen, activeTaskTitle, addFocusMinutes } = useAppStore();
  const [minutes, setMinutes] = useState(50);
  const [remaining, setRemaining] = useState(50 * 60);
  const [running, setRunning] = useState(false);
  const [sound, setSound] = useState("rain");

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
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          addFocusMinutes(minutes);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, minutes, addFocusMinutes]);

  const total = minutes * 60;
  const progress = useMemo(() => 1 - remaining / total, [remaining, total]);
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  const R = 132;
  const C = 2 * Math.PI * R;

  return (
    <Dialog open={timerOpen} onOpenChange={setTimerOpen}>
      <DialogContent
        className="max-w-full border-none bg-background/95 p-0 sm:max-w-full h-[100dvh] w-screen rounded-none backdrop-blur-2xl"
      >
        <div className="flex h-full flex-col items-center justify-center gap-8 px-6 py-10">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-primary">Deep Work</p>
            <h2 className="mt-2 max-w-xl text-balance text-xl font-bold md:text-2xl">
              {activeTaskTitle ?? "Hluboká práce bez rozptýlení"}
            </h2>
          </div>

          <div className="relative grid place-items-center">
            <svg width="300" height="300" viewBox="0 0 300 300" className="-rotate-90">
              <circle cx="150" cy="150" r={R} className="fill-none stroke-surface-2" strokeWidth="10" />
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
                onClick={() => {
                  setMinutes(p.minutes);
                  setRemaining(p.minutes * 60);
                }}
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
              onClick={() => {
                setRemaining(minutes * 60);
                setRunning(false);
              }}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          <div className="w-full max-w-md">
            <p className="mb-2 text-center text-xs uppercase tracking-widest text-muted-foreground">
              Ambientní zvuk
            </p>
            <div className="grid grid-cols-4 gap-2">
              {sounds.map((s) => (
                <button
                  key={s.id}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
