import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  value,
  label,
  className,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl glass-card px-4 py-4", className)}>
      <Icon className="h-4 w-4 text-primary" />
      <p className="mt-2 font-display text-xl font-bold">{value}</p>
      <p className="truncate text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
