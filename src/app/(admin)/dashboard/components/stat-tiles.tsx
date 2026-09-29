"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type KpiTile = {
  title: string;
  value: string;
  change: number | null;
  icon: LucideIcon;
};

export function StatTiles({ tiles }: { tiles: KpiTile[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {tiles.map((tile) => {
        const positive = (tile.change ?? 0) >= 0;
        return (
          <div
            key={tile.title}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-muted-foreground">{tile.title}</p>
              <tile.icon className="size-4 shrink-0 text-muted-foreground" />
            </div>
            <p className="mt-4 text-3xl font-semibold tracking-tight tabular-nums">
              {tile.value}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {tile.change === null ? (
                <span className="text-xs text-muted-foreground">
                  No prior data
                </span>
              ) : (
                <>
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
                      positive
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-rose-500/15 text-rose-400",
                    )}
                  >
                    {positive ? (
                      <ArrowUpRight className="size-3" />
                    ) : (
                      <ArrowDownRight className="size-3" />
                    )}
                    {positive ? "+" : ""}
                    {tile.change.toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    vs last period
                  </span>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
