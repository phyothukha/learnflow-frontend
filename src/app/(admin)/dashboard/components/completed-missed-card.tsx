"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chartTooltipStyle, type TaskOutcomePoint } from "@/utils/dashboard";
import { DashboardCardScroll, SectionCard } from "./dashboard-card";

export interface CompletedMissedCardProps {
  data: TaskOutcomePoint[];
  /** True when `data` is placeholder data rather than real tasks. */
  isSample?: boolean;
  className?: string;
}

const LEGEND = [
  { label: "Completed", className: "bg-primary" },
  { label: "Missed", className: "bg-rose-500" },
];

export function CompletedMissedCard({
  data,
  isSample = false,
  className,
}: CompletedMissedCardProps) {
  return (
    <SectionCard
      title="Completed vs missed tasks"
      meta={isSample ? "Sample data" : "All members"}
      className={className}
    >
      <DashboardCardScroll minWidth={560} className="mt-4 h-64 flex-1">
        <ResponsiveContainer width="100%" height="100%" minHeight={256}>
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
            barGap={2}
          >
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
              minTickGap={48}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.5 }}
              contentStyle={chartTooltipStyle}
              formatter={(value, name) => [
                value,
                name === "completed" ? "Completed" : "Missed",
              ]}
            />
            <Bar
              dataKey="completed"
              fill="var(--primary)"
              radius={[3, 3, 0, 0]}
              maxBarSize={10}
            />
            <Bar
              dataKey="missed"
              fill="var(--color-rose-500)"
              radius={[3, 3, 0, 0]}
              maxBarSize={10}
            />
          </BarChart>
        </ResponsiveContainer>
      </DashboardCardScroll>
      <ul className="mt-2 flex items-center gap-5 text-sm text-muted-foreground">
        {LEGEND.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <span className={`size-3 rounded-sm ${item.className}`} />
            {item.label}
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
