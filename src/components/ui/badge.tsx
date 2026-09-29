import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const STATUS_DOT =
  "gap-1.5 px-2.5 before:size-1.5 before:shrink-0 before:rounded-full before:bg-current before:content-['']";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-primary/20 bg-primary/5 text-primary/90 [a&]:hover:bg-primary/10",
        destructive:
          "bg-destructive text-white focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/90",
        outline:
          "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 [a&]:hover:underline",
        success:
          "border-emerald-500/20 bg-emerald-500/5 text-emerald-600/90 dark:text-emerald-300/90",
        warning:
          "border-amber-500/20 bg-amber-500/5 text-amber-600/90 dark:text-amber-300/90",
        info: "border-sky-500/20 bg-sky-500/5 text-sky-600/90 dark:text-sky-300/90",
        orange:
          "border-orange-500/20 bg-orange-500/5 text-orange-600/90 dark:text-orange-300/90",
        danger:
          "border-rose-500/20 bg-rose-500/5 text-rose-600/90 dark:text-rose-300/90",
        purple:
          "border-violet-500/20 bg-violet-500/5 text-violet-600/90 dark:text-violet-300/90",
        "status-blue": `${STATUS_DOT} bg-sky-500/15 text-sky-600 dark:bg-sky-400/15 dark:text-sky-400`,
        "status-red": `${STATUS_DOT} bg-rose-500/15 text-rose-600 dark:bg-rose-400/15 dark:text-rose-400`,
        "status-amber": `${STATUS_DOT} bg-amber-500/15 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400`,
        "status-green": `${STATUS_DOT} bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400`,
        "status-slate": `${STATUS_DOT} bg-slate-500/15 text-slate-600 dark:bg-slate-400/15 dark:text-slate-300`,
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

const TAG_VARIANTS: BadgeVariant[] = [
  "success",
  "warning",
  "info",
  "orange",
  "danger",
  "purple",
];

/** Stable subtle color per tag name, so the same tag always gets the same tint. */
function tagVariant(tag: string): BadgeVariant {
  let hash = 0;
  for (const char of tag.toLowerCase())
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return TAG_VARIANTS[Math.abs(hash) % TAG_VARIANTS.length];
}

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants, tagVariant, type BadgeVariant };
