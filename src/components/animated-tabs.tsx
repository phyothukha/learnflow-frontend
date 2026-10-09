"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export enum AnimatedTabsVariant {
  Underline = "underline",
  Pill = "pill",
}

export interface AnimatedTab<T extends string> {
  value: T;
  label: ReactNode;
  count?: number;
  title?: string;
}

interface IndicatorRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface PendingTab<T extends string> {
  value: T;
  from: T | null;
}

export interface AnimatedTabsProps<T extends string> {
  tabs: readonly AnimatedTab<T>[];
  /** `null` renders no active tab. */
  value: T | null;
  onValueChange: (value: T) => void;
  variant?: AnimatedTabsVariant;
  disabled?: boolean;
  className?: string;
  tabClassName?: string;
  indicatorClassName?: string;
  children?: ReactNode;
}

export function AnimatedTabs<T extends string>({
  tabs,
  value,
  onValueChange,
  variant = AnimatedTabsVariant.Underline,
  disabled = false,
  className,
  tabClassName,
  indicatorClassName,
  children,
}: AnimatedTabsProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState<PendingTab<T> | null>(null);
  const [indicator, setIndicator] = useState<IndicatorRect | null>(null);
  const [animate, setAnimate] = useState(false);

  // Highlight the clicked tab immediately while a URL-driven value catches up.
  const active = pending && pending.from === value ? pending.value : value;
  const pill = variant === AnimatedTabsVariant.Pill;

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const measure = () => {
      const tab =
        active === null
          ? null
          : list.querySelector<HTMLElement>(`[data-tab-value="${active}"]`);
      setIndicator(
        tab
          ? {
              left: tab.offsetLeft,
              top: tab.offsetTop,
              width: tab.offsetWidth,
              height: tab.offsetHeight,
            }
          : null,
      );
    };

    measure();
    const frame = requestAnimationFrame(() => setAnimate(true));
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [active]);

  return (
    <div
      ref={listRef}
      role="tablist"
      className={cn(
        "relative flex",
        pill
          ? "inline-flex w-fit items-center rounded-lg border bg-card p-1 shadow-xs"
          : "gap-1 border-b",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-0 left-0",
          pill
            ? "rounded-md bg-muted shadow-xs"
            : "h-0.5! translate-y-[-1px] rounded-full bg-primary",
          animate &&
            "transition-[transform,width,height,opacity] duration-300 ease-in-out",
          indicatorClassName,
        )}
        style={{
          opacity: indicator ? 1 : 0,
          transform: `translate(${indicator?.left ?? 0}px, ${
            pill
              ? (indicator?.top ?? 0)
              : (indicator?.top ?? 0) + (indicator?.height ?? 0)
          }px)`,
          width: indicator?.width ?? 0,
          height: pill ? (indicator?.height ?? 0) : undefined,
        }}
      />
      {tabs.map((tab) => {
        const selected = tab.value === active;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            title={tab.title}
            aria-selected={selected}
            disabled={disabled}
            data-tab-value={tab.value}
            onClick={() => {
              if (tab.value === active) return;
              setPending({ value: tab.value, from: value });
              onValueChange(tab.value);
            }}
            className={cn(
              "relative inline-flex shrink-0 items-center gap-2 text-sm whitespace-nowrap text-muted-foreground transition-colors duration-300 hover:text-foreground disabled:pointer-events-none disabled:opacity-50",
              pill
                ? "rounded-md px-3.5 py-1.5 font-medium"
                : "rounded-t-md px-4 py-2.5 hover:bg-muted/50",
              selected && "font-medium text-foreground",
              tabClassName,
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[11px] font-medium tabular-nums transition-colors duration-300",
                  selected
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
      {children}
    </div>
  );
}
