"use client";

import { cn } from "@/lib/utils";

export type TopicSegment = {
  name: string;
  count: number;
  color: string;
};

export function TopicsBreakdownCard({
  segments,
  className,
}: {
  segments: TopicSegment[];
  className?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.count, 0) || 1;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-sm",
        className,
      )}
    >
      <p className="text-sm font-medium">Topics</p>
      <div className="mt-5 space-y-3">
        {segments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No topics yet.</p>
        ) : (
          segments.map((segment) => (
            <div
              key={segment.name}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2 truncate">
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
      <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-white/5">
        {segments.map((segment) => (
          <div
            key={segment.name}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${(segment.count / total) * 100}%`,
              backgroundColor: segment.color,
            }}
          />
        ))}
      </div>
    </div>
  );
}
