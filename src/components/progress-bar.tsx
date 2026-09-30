import { cn } from "@/lib/utils";

export interface ProgressBarProps {
  value: number;
  /** Where progress should be by now; drawn as a tick on the track. */
  expected?: number;
  color?: string;
  className?: string;
}

export function ProgressBar({
  value,
  expected,
  color,
  className,
}: ProgressBarProps) {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("relative h-2 rounded-full bg-muted", className)}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-500"
        style={{ width: `${value}%`, backgroundColor: color }}
      />
      {expected !== undefined && (
        <span
          title={`Expected ${expected}%`}
          className="absolute -top-1 h-4 w-0.5 -translate-x-1/2 rounded-full bg-foreground/60"
          style={{ left: `${expected}%` }}
        />
      )}
    </div>
  );
}
