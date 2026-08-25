import { useMemo, useState } from "react";
import {
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lightbulb,
  CheckSquare,
  Plus,
  X,
  Trash2,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useAppStore,
  weekDays,
  estimateMinutes as estimate,
  stripTags,
  type Tier,
} from "@/lib/app-store";
import { useRepetitionTopics } from "./useRepetitionTopics";
import { getRepetitionStatus } from "@/lib/sm2";

const TIERS: { id: Tier; label: string; dot: string }[] = [
  { id: "must", label: "Must Do", dot: "bg-destructive" },
  { id: "should", label: "Should Do", dot: "bg-focus" },
  { id: "nice", label: "Nice to Have", dot: "bg-muted-foreground" },
];

const SLOTS = [
  ...weekDays.map((d) => ({ id: d.short, label: d.label })),
  { id: "anytime", label: "Kdykoliv tento týden" },
];

const PANEL_TABS = [
  { id: "inbox", label: "Inbox" },
  { id: "repeat", label: "K opakování" },
] as const;

type PanelTab = (typeof PANEL_TABS)[number]["id"];

function overdueLabel(count: number): string {
  if (count === 1) return "1 rest z minulých dnů";
  if (count >= 2 && count <= 4) return `${count} resty z minulých dnů`;
  return `${count} restů z minulých dnů`;
}

export function Planner() {
  const {
    inbox,
    placements,
    setPlacement,
    removePlacement,
    removeFromInbox,
    addToInbox,
    overdueCount,
  } = useAppStore();
  const [weekOffset, setWeekOffset] = useState(0);
  const [mobileTab, setMobileTab] = useState<"inbox" | "plan">("inbox");
  const [panelTab, setPanelTab] = useState<PanelTab>("inbox");
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [detailSlot, setDetailSlot] = useState<string | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [showFutureDays, setShowFutureDays] = useState(false);
  const allRepetition = useRepetitionTopics(showFutureDays ? 7 : 0);

  const unplaced = useMemo(() => inbox.filter((i) => !placements[i.id]), [inbox, placements]);

  const repetition = useMemo(() => {
    const placedTopicIds = new Set(
      inbox.filter((i) => placements[i.id] && i.sourceTopicId).map((i) => i.sourceTopicId!),
    );
    return allRepetition.filter((t) => !placedTopicIds.has(t.id));
  }, [allRepetition, inbox, placements]);

  const totalMinutes = useMemo(
    () => inbox.filter((i) => placements[i.id]).reduce((sum, i) => sum + estimate(i), 0),
    [inbox, placements],
  );

  const itemsIn = (slot: string, tier: Tier) =>
    inbox.filter((i) => placements[i.id]?.slot === slot && placements[i.id]?.tier === tier);

  const onDrop = (payload: string, slot: string, tier: Tier) => {
    setDragOver(null);
    if (payload.startsWith("rep:")) {
      const topicId = payload.slice(4);
      const topic = allRepetition.find((t) => t.id === topicId);
      if (!topic) return;
      const id = addToInbox(topic.title, { sourceTopicId: topic.id });
      if (id) setPlacement(id, slot, tier);
      return;
    }
    setPlacement(payload, slot, tier);
  };

  const submitDraft = () => {
    if (draft?.trim()) addToInbox(draft);
    setDraft(null);
  };

  const weekLabel =
    weekOffset === 0
      ? "Tento týden"
      : weekOffset < 0
        ? `${Math.abs(weekOffset)} týden zpět`
        : `${weekOffset} týden vpřed`;
  const detail = SLOTS.find((s) => s.id === detailSlot);

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-2xl glass-card p-1.5 lg:hidden">
        {(["inbox", "plan"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setMobileTab(t)}
            className={cn(
              "flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              mobileTab === t ? "bg-surface-2 text-foreground" : "text-muted-foreground",
            )}
          >
            {t === "inbox" ? "Inbox" : "Plán"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:h-screen lg:grid-cols-[35fr_65fr] lg:overflow-hidden">
        {/* Inbox / K opakování */}
        <section
          className={cn(
            "flex flex-col rounded-3xl glass-card p-4 lg:h-full lg:overflow-hidden",
            mobileTab === "inbox" ? "" : "hidden lg:flex",
          )}
        >
          <div className="flex gap-1 rounded-2xl bg-surface-2/40 p-1">
            {PANEL_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setPanelTab(t.id)}
                className={cn(
                  "flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  panelTab === t.id
                    ? "bg-surface-2 text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
                <span className="ml-1.5 text-[11px] text-muted-foreground">
                  {t.id === "inbox" ? unplaced.length : repetition.length}
                </span>
              </button>
            ))}
          </div>

          {panelTab === "inbox" && overdueCount > 0 && (
            <p className="mt-2 text-xs text-destructive">{overdueLabel(overdueCount)}</p>
          )}

          <ul className="mt-3 flex-1 space-y-2 lg:min-h-0 lg:overflow-y-auto">
            {panelTab === "inbox" &&
              unplaced.map((item) => (
                <li
                  key={item.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", item.id);
                  }}
                  className="group flex cursor-grab items-start gap-2 rounded-2xl border border-border bg-surface-2/50 p-3 transition-colors hover:border-primary/40 active:cursor-grabbing"
                >
                  <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">{stripTags(item.text)}</p>
                    <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      {item.type === "idea" ? (
                        <Lightbulb className="h-3 w-3" />
                      ) : (
                        <CheckSquare className="h-3 w-3" />
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {estimate(item)} min
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromInbox(item.id)}
                    aria-label="Smazat záznam"
                    className="grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-full text-muted-foreground opacity-0 transition-all hover:bg-destructive/15 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}

            {panelTab === "inbox" && unplaced.length === 0 && !draft && (
              <li className="rounded-2xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                Inbox je prázdný — přidej nápad tlačítkem +
              </li>
            )}

            {panelTab === "inbox" &&
              (draft === null ? (
                <li>
                  <button
                    onClick={() => setDraft("")}
                    className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border py-2.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                  >
                    <Plus className="h-3.5 w-3.5" /> Přidat
                  </button>
                </li>
              ) : (
                <li>
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={submitDraft}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitDraft();
                      if (e.key === "Escape") setDraft(null);
                    }}
                    placeholder="Nový úkol"
                    className="w-full rounded-2xl border border-primary/50 bg-surface-2/60 px-3 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none"
                  />
                </li>
              ))}

            {panelTab === "repeat" &&
              repetition.map((t) => {
                const status = getRepetitionStatus(t);
                const estimatedMinutes = t.isNew
                  ? 25
                  : t.level === "hard"
                    ? 30
                    : t.level === "medium"
                      ? 20
                      : 15;

                return (
                  <li
                    key={t.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", `rep:${t.id}`);
                    }}
                    className="group relative flex cursor-grab items-start gap-2 rounded-2xl border border-border bg-surface-2/50 p-3 transition-colors hover:border-primary/40 active:cursor-grabbing"
                  >
                    <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm leading-snug">{t.title}</p>
                        {status.badge && (
                          <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                            {status.badge}
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Brain className="h-3 w-3" />
                        <span className="truncate">{t.project}</span>
                        <Clock className="h-3 w-3" />
                        <span>~{estimatedMinutes}min</span>
                        <span
                          className={cn(
                            "ml-auto shrink-0 rounded-full px-2 py-0.5",
                            t.isNew
                              ? "bg-primary/15 text-primary"
                              : t.level === "hard"
                                ? "bg-destructive/15 text-destructive"
                                : t.level === "medium"
                                  ? "bg-warning/15 text-warning"
                                  : t.level === "easy"
                                    ? "bg-success/15 text-success"
                                    : "bg-muted text-muted-foreground",
                          )}
                        >
                          {t.isNew
                            ? "Nové"
                            : t.level === "hard"
                              ? "Těžké"
                              : t.level === "medium"
                                ? "Střední"
                                : t.level === "easy"
                                  ? "Snadné"
                                  : "—"}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}

            {panelTab === "repeat" && repetition.length === 0 && (
              <li className="rounded-2xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                Nic k naplánování — přidej témata ve study projektech, nebo počkej na splatnost po
                známce
              </li>
            )}

            {panelTab === "repeat" && repetition.length > 0 && (
              <li className="pt-2">
                <button
                  onClick={() => setShowFutureDays(!showFutureDays)}
                  className="w-full rounded-2xl border border-dashed border-border px-3 py-2 text-center text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                >
                  {showFutureDays ? "Zobrazit jen dnešní" : "Zobrazit další dny"}
                </button>
              </li>
            )}
          </ul>
        </section>

        {/* Týdenní plán */}
        <section
          className={cn(
            "flex flex-col gap-3 lg:h-full lg:overflow-hidden",
            mobileTab === "plan" ? "" : "hidden lg:block",
          )}
        >
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-3xl glass-card px-4 py-3 lg:py-2.5">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              aria-label="Předchozí týden"
              className="grid h-8 w-8 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0 text-center">
              <p className="truncate font-display text-sm font-bold">{weekLabel}</p>
              <p className="text-[11px] text-muted-foreground">
                Naplánováno {Math.floor(totalMinutes / 60)} h {totalMinutes % 60} min
              </p>
            </div>
            <button
              onClick={() => setWeekOffset((w) => w + 1)}
              aria-label="Další týden"
              className="grid h-8 w-8 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid flex-1 gap-3 min-h-0 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
            {SLOTS.map((slot) => {
              const firstMust = itemsIn(slot.id, "must")[0];
              return (
                <div
                  key={slot.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setDetailSlot(slot.id)}
                  onKeyDown={(e) => e.key === "Enter" && setDetailSlot(slot.id)}
                  className="flex cursor-pointer flex-col min-h-0 rounded-3xl glass-card p-3 transition-colors hover:border-primary/40"
                >
                  <h3 className="truncate font-display text-sm font-bold">{slot.label}</h3>
                  <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
                    {firstMust ? stripTags(firstMust.text) : "Zatím nic naplánováno"}
                  </p>

                  <div className="mt-2 flex flex-col gap-1.5">
                    {TIERS.map((tier) => {
                      const key = `${slot.id}:${tier.id}`;
                      const count = itemsIn(slot.id, tier.id).length;
                      const active = dragOver === key;
                      return (
                        <div
                          key={tier.id}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOver(key);
                          }}
                          onDragLeave={() => setDragOver((k) => (k === key ? null : k))}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const id = e.dataTransfer.getData("text/plain");
                            if (id) onDrop(id, slot.id, tier.id);
                          }}
                          className={cn(
                            "flex items-center gap-2 rounded-full border border-border bg-surface-2/40 px-2.5 py-1 text-[11px] transition-all duration-200 origin-center",
                            active && "scale-105 border-primary/70 bg-primary/15 py-1.5",
                          )}
                        >
                          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", tier.dot)} />
                          <span className="truncate text-muted-foreground">{tier.label}</span>
                          {active ? (
                            <Plus className="ml-auto h-3.5 w-3.5 shrink-0 text-primary" />
                          ) : (
                            count > 0 && (
                              <span className="ml-auto shrink-0 text-foreground">({count})</span>
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {detail && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur-sm"
          onClick={() => setDetailSlot(null)}
        >
          <div
            role="dialog"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-3xl glass-card p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-lg font-bold">{detail.label}</h3>
              <button
                onClick={() => setDetailSlot(null)}
                aria-label="Zavřít"
                className="grid h-8 w-8 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {TIERS.map((tier) => {
                const items = itemsIn(detail.id, tier.id);
                return (
                  <div key={tier.id}>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className={cn("h-1.5 w-1.5 rounded-full", tier.dot)} />
                      {tier.label} ({items.length})
                    </div>
                    <ul className="mt-2 space-y-1.5">
                      {items.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center gap-2 rounded-2xl border border-border bg-surface-2/40 px-3 py-2 text-sm"
                        >
                          <span className="min-w-0 flex-1 truncate">{stripTags(item.text)}</span>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {estimate(item)} min
                          </span>
                          <button
                            onClick={() => removePlacement(item.id)}
                            aria-label="Vrátit do inboxu"
                            className="grid h-6 w-6 shrink-0 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => removeFromInbox(item.id)}
                            aria-label="Smazat záznam"
                            className="grid h-6 w-6 shrink-0 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                      {items.length === 0 && (
                        <li className="rounded-2xl border border-dashed border-border px-3 py-3 text-center text-[11px] text-muted-foreground">
                          Prázdné
                        </li>
                      )}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
