"use client";

import Link from "next/link";
import { Expand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CompletionGaugeCard({
  rate,
  className,
}: {
  rate: number | null;
  className?: string;
}) {
  const value = rate ?? 0;
  const r = 54;
  const c = 2 * Math.PI * r;
  const half = c / 2;
  const progress = Math.min(100, Math.max(0, value)) / 100;
  const offset = half * (1 - progress);

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm",
        className,
      )}
    >
      <p className="text-sm font-medium">Study Completion</p>
      <div className="relative mx-auto mt-2 flex h-36 w-full max-w-[220px] items-end justify-center">
        <svg viewBox="0 0 140 90" className="h-full w-full">
          <path
            d="M 16 80 A 54 54 0 0 1 124 80"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M 16 80 A 54 54 0 0 1 124 80"
            fill="none"
            stroke="#5992C6"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${half}`}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-2 text-center">
          <p className="text-3xl font-semibold tabular-nums">
            {rate === null ? "—" : `${Math.round(value)}%`}
          </p>
        </div>
      </div>
      <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
        <Link href="/library">Show details</Link>
      </Button>
    </div>
  );
}

export function AssistantCard({
  topicTitle,
  notePreview,
  className,
}: {
  topicTitle: string | null;
  notePreview: string | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-border bg-card p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium">Quick Notes</p>
        <Link
          href="/notes"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          title="Open notes"
        >
          <Expand className="size-4" />
        </Link>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {topicTitle ? `Topic · ${topicTitle}` : "All topics"}
      </p>
      <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-muted-foreground">
        {notePreview || "No recent notes. Capture thoughts while you study."}
      </p>
    </div>
  );
}
