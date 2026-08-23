import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
}: {
  value: number;
  className?: string | undefined;
}) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
      <div
        className={cn("h-full rounded-full bg-primary transition-all duration-700", className)}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
