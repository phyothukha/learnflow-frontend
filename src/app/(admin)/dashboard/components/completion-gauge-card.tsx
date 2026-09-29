"use client";

import Link from "next/link";
import { Expand, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardCard } from "./dashboard-card";

export interface CompletionGaugeCardProps {
  rate: number | null;
  className?: string;
}

export function CompletionGaugeCard({
  rate,
  className,
}: CompletionGaugeCardProps) {
  const value = rate ?? 0;
  const r = 54;
  const c = 2 * Math.PI * r;
  const half = c / 2;
  const progress = Math.min(100, Math.max(0, value)) / 100;
  const offset = half * (1 - progress);

  return (
    <DashboardCard title="Study Completion" icon={Gauge} className={className}>
      <div className="relative mx-auto mt-4 flex h-32 w-full max-w-[220px] items-end justify-center">
        <svg viewBox="0 0 140 90" className="h-full w-full">
          <path
            d="M 16 80 A 54 54 0 0 1 124 80"
            fill="none"
            stroke="var(--muted)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M 16 80 A 54 54 0 0 1 124 80"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${half}`}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-2 text-center">
          <p className="text-3xl font-semibold tracking-tight tabular-nums">
            {rate === null ? "—" : `${Math.round(value)}%`}
          </p>
        </div>
      </div>
      <div className="mt-auto pt-4">
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href="/library">Show details</Link>
        </Button>
      </div>
    </DashboardCard>
  );
}

export interface AssistantCardProps {
  topicTitle: string | null;
  notePreview: string | null;
  className?: string;
}

export function AssistantCard({
  topicTitle,
  notePreview,
  className,
}: AssistantCardProps) {
  return (
    <DashboardCard
      title="Quick Notes"
      className={className}
      action={
        <Link
          href="/notes"
          className="-m-1 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Open notes"
        >
          <Expand className="size-4" />
        </Link>
      }
    >
      <p className="mt-1 text-xs text-muted-foreground">
        {topicTitle ? `Topic · ${topicTitle}` : "All topics"}
      </p>
      <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-foreground/80">
        {notePreview || "No recent notes. Capture thoughts while you study."}
      </p>
    </DashboardCard>
  );
}
