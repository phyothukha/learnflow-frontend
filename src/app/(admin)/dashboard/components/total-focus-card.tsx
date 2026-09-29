"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { chartTooltipStyle, formatHours } from "./dashboard-utils";

export type FocusPoint = {
  label: string;
  current: number;
  previous: number;
};

export function TotalFocusCard({
  totalMinutes,
  change,
  data,
  className,
}: {
  totalMinutes: number;
  change: number | null;
  data: FocusPoint[];
  className?: string;
}) {
  const positive = (change ?? 0) >= 0;

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Total Focus</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="text-3xl font-semibold tracking-tight tabular-nums">
              {formatHours(totalMinutes)}
            </p>
            {change !== null && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  positive
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-rose-500/15 text-rose-400",
                )}
              >
                {positive ? "+" : ""}
                {change.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 h-56 min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
          >
            <defs>
              <linearGradient id="focusFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5992C6" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#5992C6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="4 4"
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickFormatter={(v: number) =>
                v >= 60 ? `${Math.round(v / 60)}h` : `${v}m`
              }
              width={40}
            />
            <Tooltip
              contentStyle={chartTooltipStyle}
              formatter={(value, name) => [
                `${value} min`,
                name === "current" ? "This period" : "Last period",
              ]}
            />
            <Area
              type="monotone"
              dataKey="current"
              stroke="#5992C6"
              strokeWidth={2.5}
              fill="url(#focusFill)"
              dot={false}
              activeDot={{ r: 4, fill: "#5992C6" }}
            />
            <Line
              type="monotone"
              dataKey="previous"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
