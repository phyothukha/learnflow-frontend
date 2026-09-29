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
import { CalendarDays } from "lucide-react";
import { chartTooltipStyle } from "./dashboard-utils";
import {
  DashboardCard,
  DashboardCardScroll,
  DashboardCardValue,
} from "./dashboard-card";

export interface DayActivePoint {
  day: string;
  minutes: number;
}

export interface MostActiveDayCardProps {
  totalLabel: string;
  data: DayActivePoint[];
  className?: string;
}

export function MostActiveDayCard({
  totalLabel,
  data,
  className,
}: MostActiveDayCardProps) {
  const max = Math.max(...data.map((d) => d.minutes), 1);

  return (
    <DashboardCard
      title="Most Active Day"
      icon={CalendarDays}
      className={className}
    >
      <DashboardCardValue>{totalLabel}</DashboardCardValue>
      <DashboardCardScroll minWidth={300} className="mt-4 h-60 flex-1">
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
              cursor={{ fill: "var(--muted)", opacity: 0.5 }}
              contentStyle={chartTooltipStyle}
              formatter={(value) => [`${value} min`, "Focus"]}
            />
            <Bar dataKey="minutes" radius={[6, 6, 6, 6]} maxBarSize={28}>
              {data.map((entry) => (
                <Cell
                  key={entry.day}
                  fill={
                    entry.minutes === max && entry.minutes > 0
                      ? "var(--primary)"
                      : "color-mix(in srgb, var(--primary) 18%, transparent)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </DashboardCardScroll>
    </DashboardCard>
  );
}
