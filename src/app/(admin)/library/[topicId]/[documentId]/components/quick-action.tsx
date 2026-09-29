import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

export function QuickAction({
  icon: Icon,
  label,
  onClick,
  disabled,
  destructive,
}: QuickActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
        destructive && "hover:border-destructive/40 hover:text-destructive",
      )}
    >
      <Icon className="size-3.5" />
    </button>
  );
}
