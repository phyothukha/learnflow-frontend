import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface StatTileProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  className?: string;
}

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: StatTileProps) {
  return (
    <div className={cn("planner-panel space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="planner-label">{label}</span>
        {Icon && <Icon className="size-4 text-muted-foreground" />}
      </div>
      <div className="text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
