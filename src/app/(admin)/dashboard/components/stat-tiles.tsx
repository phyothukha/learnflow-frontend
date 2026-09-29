"use client";

import type { LucideIcon } from "lucide-react";
import {
  ChangePill,
  DashboardCard,
  DashboardCardValue,
} from "./dashboard-card";

export type KpiTile = {
  title: string;
  value: string;
  change: number | null;
  icon: LucideIcon;
};

export function StatTiles({ tiles }: { tiles: KpiTile[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {tiles.map((tile) => (
        <DashboardCard key={tile.title} title={tile.title} icon={tile.icon}>
          <DashboardCardValue>{tile.value}</DashboardCardValue>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {tile.change === null ? (
              <span className="text-xs text-muted-foreground">
                No prior data
              </span>
            ) : (
              <>
                <ChangePill change={tile.change} />
                <span className="text-xs text-muted-foreground">
                  vs last period
                </span>
              </>
            )}
          </div>
        </DashboardCard>
      ))}
    </div>
  );
}
