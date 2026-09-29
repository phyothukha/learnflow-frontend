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
import { Timer } from "lucide-react";
import { chartTooltipStyle, formatHours } from "./dashboard-utils";
import {
  ChangePill,
  DashboardCard,
  DashboardCardScroll,
  DashboardCardValue,
} from "./dashboard-card";

export interface FocusPoint {
  label: string;
  current: number;
  previous: number;
}

export interface TotalFocusCardProps {
  totalMinutes: number;
  change: number | null;
  data: FocusPoint[];
  className?: string;
}

export function TotalFocusCard({
  totalMinutes,
  change,
  data,
  className,
}: TotalFocusCardProps) {
  return (
    <DashboardCard title="Total Focus" icon={Timer} className={className}>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <DashboardCardValue className="mt-0">
          {formatHours(totalMinutes)}
        </DashboardCardValue>
        {change !== null && <ChangePill change={change} />}
      </div>

      <DashboardCardScroll minWidth={560} className="mt-4 h-60 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
          >
            <defs>
              <linearGradient id="focusFill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--primary)"
                  stopOpacity={0.35}
                />
                <stop
                  offset="100%"
                  stopColor="var(--primary)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
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
              stroke="var(--primary)"
              strokeWidth={2.5}
              fill="url(#focusFill)"
              dot={false}
              activeDot={{ r: 4, fill: "var(--primary)" }}
            />
            <Line
              type="monotone"
              dataKey="previous"
              stroke="var(--muted-foreground)"
              strokeOpacity={0.6}
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </DashboardCardScroll>
    </DashboardCard>
  );
}
