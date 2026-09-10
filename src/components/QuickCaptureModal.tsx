import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/app-store";

const VOICE_INPUT_ENABLED = false; // Skryto — hlasový vstup patří do v2.0, viz plán

const TAGS = [
  { label: "#Úkol", value: "#Úkol" },
  { label: "#Nápad", value: "#Nápad" },
] as const;

const MIN_ROWS = 2;

export function QuickCaptureModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addToInbox } = useAppStore();
  const [text, setText] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const reset = useCallback(() => {
    setText("");
    setSelectedTags(new Set());
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => textareaRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, MIN_ROWS * 24)}px`;
  }, [text]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  const toggleTag = useCallback((value: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, []);

  const hasContent = text.trim().length > 0 || selectedTags.size > 0;

  const save = useCallback(() => {
    const body = text.trim();
    if (!body && selectedTags.size === 0) return;
    const tags = Array.from(selectedTags);
    const combined = tags.length > 0 ? `${tags.join(" ")} ${body}` : body;
    addToInbox(combined);
    reset();
    onClose();
  }, [text, selectedTags, addToInbox, onClose, reset]);

  const handleBackdropClick = useCallback(() => {
    if (!hasContent) onClose();
  }, [hasContent, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Rychlé zadání"
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface/95 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <span className="text-sm font-medium text-muted-foreground">Nový záznam</span>
          <button
            type="button"
            onClick={handleClose}
            className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            aria-label="Zavřít"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 pt-4 pb-2">
          {selectedTags.size > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {Array.from(selectedTags).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={text}
            aria-label="Nový záznam"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") save();
            }}
            placeholder="Co máš na mysli? Napiš úkol nebo nápad..."
            rows={MIN_ROWS}
            className="w-full resize-none overflow-hidden bg-transparent text-lg leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-2">
            {VOICE_INPUT_ENABLED && (
              <>
                <button
                  type="button"
                  disabled
                  title="Připravujeme"
                  className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                  aria-label="Hlasový vstup"
                >
                  <Mic className="h-4 w-4" />
                </button>
                <div className="h-5 w-px bg-border" />
              </>
            )}
            <div className="flex items-center gap-1.5">
              {TAGS.map((tag) => {
                const active = selectedTags.has(tag.value);
                return (
                  <button
                    key={tag.label}
                    type="button"
                    onClick={() => toggleTag(tag.value)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                      active
                        ? "border-primary/40 bg-primary/15 text-primary"
                        : "border-border bg-surface-2/60 text-muted-foreground hover:border-primary/30 hover:text-foreground",
                    )}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={save}
            disabled={!hasContent}
            className={cn(
              "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all",
              hasContent ? "hover:bg-primary/90" : "cursor-not-allowed opacity-50",
            )}
          >
            Uložit do Inboxu
          </button>
        </div>
      </div>
    </div>
  );
}
