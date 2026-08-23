import { CalendarDays } from "lucide-react";
import { useAppStore } from "@/lib/app-store";
import { cn } from "@/lib/utils";

export function DayRing({
  short,
  progress,
  isToday,
}: {
  short: string;
  progress: number;
  isToday: boolean | undefined;
}) {
  const r = 20;
  const c = 2 * Math.PI * r;
  const full = progress >= 1;




  return (
    <div className="relative grid aspect-square w-full min-w-0 max-w-6 flex-1 place-items-center sm:max-w-9 md:max-w-11">
      <svg
        viewBox="0 0 48 48"
        shapeRendering="geometricPrecision"
        className="absolute inset-0 h-full w-full -rotate-90"
      >
        <circle
          cx="24"
          cy="24"
          r={r}
          className="fill-none stroke-gray-800"
          strokeWidth="3"
        />
        {full && (
          <circle
            cx="24"
            cy="24"
            r={12}
            className="fill-emerald-900/15"
          />
        )}
        {progress > 0 && (
          <circle
            cx="24"
            cy="24"
            r={r}
            className="fill-none stroke-emerald-500 transition-[stroke-dashoffset] duration-500"
            strokeWidth={full ? "4.5" : "2.5"}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - Math.min(progress, 1))}
          />
        )}
      </svg>
      <span
        className={cn(
          "relative text-[clamp(7px,1.5vw,12px)]",
          full
            ? "font-semibold text-emerald-500"
            : isToday
              ? "font-semibold text-foreground"
              : "font-medium text-muted-foreground",
        )}
      >
        {short}
      </span>
      {isToday && (
        <span className="absolute bottom-[12%] h-1 w-1 rounded-full bg-foreground/70" />
      )}
    </div>
  );
}

export function StreakHeader() {
  const { streak, week } = useAppStore();

  return (
    <header className="glass-card w-full overflow-hidden rounded-3xl px-2.5 py-3 min-[360px]:px-3 sm:px-5 md:px-6">
      <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5 min-[360px]:gap-2 sm:gap-4">
        <div className="flex min-w-0 items-center gap-1 sm:gap-2">
          <span className="flame-glow shrink-0 text-lg min-[360px]:text-xl sm:text-2xl md:text-3xl">🔥</span>
          <p className="truncate whitespace-nowrap font-display text-sm font-bold leading-none min-[360px]:text-base sm:text-xl md:text-2xl">
            {streak} dní
          </p>
        </div>

        <div className="flex min-w-0 items-center justify-center gap-1 sm:gap-1.5 md:gap-2">
          {week.map((d) => (
            <DayRing
              key={d.label}
              short={d.short}
              progress={d.progress}
              isToday={d.isToday}
            />
          ))}
        </div>

        <div className="flex shrink-0 justify-end">
          <button
            type="button"
            aria-label="Přehled aktivity"
            title="Přehled aktivity"
            className="grid size-8 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-foreground/5 hover:text-foreground active:scale-95 sm:size-10"
          >
            <CalendarDays
              className="size-[1.1rem] sm:size-[1.35rem]"
              strokeWidth={2}
            />
          </button>
        </div>
      </div>
    </header>
  );
}
