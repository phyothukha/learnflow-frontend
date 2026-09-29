"use client";

import { Layers } from "lucide-react";
import { DashboardCard, DashboardCardValue } from "./dashboard-card";

export interface TopicSegment {
  name: string;
  count: number;
  color: string;
}

export interface TopicsBreakdownCardProps {
  segments: TopicSegment[];
  className?: string;
}

export function TopicsBreakdownCard({
  segments,
  className,
}: TopicsBreakdownCardProps) {
  const sum = segments.reduce((acc, s) => acc + s.count, 0);
  const total = sum || 1;

  return (
    <DashboardCard title="Topics" icon={Layers} className={className}>
      <DashboardCardValue>{sum.toLocaleString()}</DashboardCardValue>
      <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-muted">
        {segments.map((segment) => (
          <div
            key={segment.name}
            className="h-full"
            style={{
              width: `${(segment.count / total) * 100}%`,
              backgroundColor: segment.color,
            }}
          />
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {segments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No topics yet.</p>
        ) : (
          segments.map((segment) => (
            <div
              key={segment.name}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="truncate text-muted-foreground">
                  {segment.name}
                </span>
              </span>
              <span className="font-medium tabular-nums">{segment.count}</span>
            </div>
          ))
        )}
      </div>
    </DashboardCard>
  );
}
