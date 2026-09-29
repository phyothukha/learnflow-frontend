import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const dashboardCardClass =
  "flex min-w-0 flex-col rounded-2xl border border-border bg-card p-5 shadow-sm";

export interface DashboardCardScrollProps {
  minWidth: number;
  className?: string;
  children: ReactNode;
}

/** Scrolls its content horizontally inside the card once the card is narrower than `minWidth`. */
export function DashboardCardScroll({
  minWidth,
  className,
  children,
}: DashboardCardScrollProps) {
  return (
    <div
      className={cn(
        "scrollbar-handle -mx-1 overflow-x-auto overflow-y-hidden px-1 pb-2",
        className,
      )}
    >
      <div className="h-full" style={{ minWidth }}>
        {children}
      </div>
    </div>
  );
}

export interface DashboardCardProps {
  title: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function DashboardCard({
  title,
  icon: Icon,
  action,
  className,
  children,
}: DashboardCardProps) {
  return (
    <div className={cn(dashboardCardClass, className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{title}</p>
        {action ??
          (Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />)}
      </div>
      {children}
    </div>
  );
}

export interface DashboardCardValueProps {
  children: ReactNode;
  className?: string;
}

export function DashboardCardValue({
  children,
  className,
}: DashboardCardValueProps) {
  return (
    <p
      className={cn(
        "mt-4 text-3xl font-semibold tracking-tight tabular-nums",
        className,
      )}
    >
      {children}
    </p>
  );
}

export interface ChangePillProps {
  change: number;
}

export function ChangePill({ change }: ChangePillProps) {
  const positive = change >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
        positive
          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          : "bg-rose-500/15 text-rose-600 dark:text-rose-400",
      )}
    >
      {positive ? (
        <ArrowUpRight className="size-3" />
      ) : (
        <ArrowDownRight className="size-3" />
      )}
      {positive ? "+" : ""}
      {change.toFixed(1)}%
    </span>
  );
}
