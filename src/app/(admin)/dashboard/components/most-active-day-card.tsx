"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { chartTooltipStyle } from "./dashboard-utils";

export type DayActivePoint = {
  day: string;
  minutes: number;
};

export function MostActiveDayCard({
  totalLabel,
  data,
  className,
}: {
  totalLabel: string;
  data: DayActivePoint[];
  className?: string;
}) {
  const max = Math.max(...data.map((d) => d.minutes), 1);

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm",
        className,
      )}
    >
      <p className="text-sm text-muted-foreground">Most Day Active</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
        {totalLabel}
      </p>
      <div className="mt-4 h-48 min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 4, left: -20, bottom: 0 }}
          >
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              contentStyle={chartTooltipStyle}
              formatter={(value) => [`${value} min`, "Focus"]}
            />
            <Bar dataKey="minutes" radius={[6, 6, 6, 6]} maxBarSize={28}>
              {data.map((entry) => (
                <Cell
                  key={entry.day}
                  fill={
                    entry.minutes === max && entry.minutes > 0
                      ? "#5992C6"
                      : "rgba(255,255,255,0.12)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
