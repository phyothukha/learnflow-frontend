import type { ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className={cn("dashboard-card", className)}>
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
  /** `pt` shows a percentage-point difference instead of a relative percent. */
  unit?: "%" | "pt";
  /** Whether an increase is good news; false turns increases red. */
  positiveIsGood?: boolean;
}

export function ChangePill({
  change,
  unit = "%",
  positiveIsGood = true,
}: ChangePillProps) {
  const up = change >= 0;
  const good = up === positiveIsGood;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
        good
          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          : "bg-rose-500/15 text-rose-600 dark:text-rose-400",
      )}
    >
      {up ? (
        <ArrowUpRight className="size-3" />
      ) : (
        <ArrowDownRight className="size-3" />
      )}
      {up ? "+" : ""}
      {change.toFixed(1)}
      {unit === "pt" ? " pt" : "%"}
    </span>
  );
}

export interface SectionCardProps {
  title: string;
  /** Muted text on the right of the title. */
  meta?: string;
  /** Replaces `meta`, e.g. a CardLinkAction. */
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Card with a prominent title, used for charts and lists. */
export function SectionCard({
  title,
  meta,
  action,
  className,
  children,
}: SectionCardProps) {
  return (
    <section className={cn("dashboard-card", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        {action ??
          (meta && (
            <span className="text-sm text-muted-foreground">{meta}</span>
          ))}
      </div>
      {children}
    </section>
  );
}

export interface CardLinkActionProps {
  label: string;
  onClick: () => void;
}

export function CardLinkAction({ label, onClick }: CardLinkActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
    >
      {label}
      <ArrowRight className="size-3.5" />
    </button>
  );
}
