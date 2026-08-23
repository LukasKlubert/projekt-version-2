import { Link } from "@tanstack/react-router";
import { LayoutDashboard, FolderKanban, Users, User, Lock } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/hooks/use-hydrated";
import { DeepWorkTimer } from "./DeepWorkTimer";
import { FloatingActionButton } from "./FloatingActionButton";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, disabled: false },
  { to: "/projekty", label: "Projekty", icon: FolderKanban, disabled: false },
  { to: "/hub", label: "Hub", icon: Users, disabled: true },
  { to: "/profil", label: "Profil", icon: User, disabled: false },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const hydrated = useHydrated();
  return (
    <div className="min-h-screen md:pl-[248px]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col gap-2 border-r border-border bg-sidebar/70 px-4 py-6 backdrop-blur-xl md:flex">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[image:var(--gradient-primary)] text-lg font-black text-primary-foreground">
            F
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-base font-bold">Fokus</p>
            <p className="truncate text-xs text-muted-foreground">Deep Work OS</p>
          </div>
        </div>
        {items.map((item) => (
          <NavItem key={item.to} {...item} variant="side" />
        ))}
        <div className="mt-auto rounded-2xl border border-border bg-surface-2/60 p-4">
          <p className="text-xs text-muted-foreground">Dnešní cíl</p>
          <p className="mt-1 font-display text-lg font-bold">3 hodiny deep work</p>
        </div>
      </aside>

      <main className="mx-auto w-full max-w-5xl px-4 pt-6 pb-28 md:px-8 md:pt-10 md:pb-14">
        {children}
      </main>

      {/* Mobile bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/85 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-4">
          {items.map((item) => (
            <NavItem key={item.to} {...item} variant="bottom" />
          ))}
        </div>
      </nav>

      {hydrated && <DeepWorkTimer />}
      <FloatingActionButton />
    </div>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  disabled,
  variant,
}: {
  to: string;
  label: string;
  icon: typeof Users;
  disabled: boolean;
  variant: "side" | "bottom";
}) {
  const side = variant === "side";
  const base = side
    ? "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
    : "flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition-colors";

  if (disabled) {
    return (
      <div className={cn(base, "cursor-not-allowed text-muted-foreground/50")} title="Brzy">
        <span className="relative">
          <Icon className="h-5 w-5" />
          <Lock className="absolute -right-1.5 -bottom-1 h-3 w-3" />
        </span>
        <span className="truncate">{label}</span>
      </div>
    );
  }

  return (
    <Link
      to={to}
      activeOptions={{ exact: to === "/" }}
      className={cn(base, "text-muted-foreground hover:text-foreground")}
      activeProps={{
        className: side
          ? "bg-surface-2 text-foreground"
          : "text-primary [&_svg]:drop-shadow-[0_0_8px_color-mix(in_oklab,var(--primary)_80%,transparent)]",
      }}
    >
      <Icon className="h-5 w-5" />
      <span className="truncate">{label}</span>
    </Link>
  );
}
