import { useState } from "react";
import { Plus } from "lucide-react";
import { QuickCaptureModal } from "./QuickCaptureModal";

export function FloatingActionButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Rychle přidat nápad nebo úkol"
        className="fixed right-4 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-40 grid h-12 w-12 place-items-center rounded-full bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[0_10px_28px_-8px_color-mix(in_oklab,var(--primary)_45%,transparent)] transition-all duration-200 hover:scale-105 hover:shadow-[0_14px_36px_-10px_color-mix(in_oklab,var(--primary)_55%,transparent)] active:scale-95 md:right-6 md:bottom-6 md:h-14 md:w-14 cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-6 w-6 md:h-7 md:w-7" strokeWidth={1.5} />
      </button>

      <QuickCaptureModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
