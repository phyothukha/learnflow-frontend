"use client";

import {
  Bar,
  BarChart,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type BarShapeProps,
} from "recharts";
import { chartTooltipStyle, type WeekdayCountPoint } from "@/utils/dashboard";
import { DashboardCardScroll, SectionCard } from "./dashboard-card";

export interface MostActiveDayCardProps {
  data: WeekdayCountPoint[];
  /** True when `data` is placeholder data rather than real tasks. */
  isSample?: boolean;
  className?: string;
}

export function MostActiveDayCard({
  data,
  isSample = false,
  className,
}: MostActiveDayCardProps) {
  const peak = data.reduce(
    (best, point) => (point.count > best.count ? point : best),
    { name: "", count: 0 },
  );

  return (
    <SectionCard
      title="Most active day"
      meta={isSample ? "Sample data" : undefined}
      className={className}
    >
      <p className="mt-4 text-3xl font-semibold tracking-tight">
        {peak.count > 0 ? peak.name : "—"}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {peak.count > 0
          ? `${peak.count.toLocaleString()} tasks completed on ${peak.name}s`
          : "No completed tasks in this period"}
      </p>
      <DashboardCardScroll minWidth={260} className="mt-4 h-48 flex-1">
        <ResponsiveContainer width="100%" height="100%" minHeight={192}>
          <BarChart
            data={data}
            margin={{ top: 8, right: 4, left: 4, bottom: 0 }}
          >
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickFormatter={(name: string) => name[0]}
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.5 }}
              contentStyle={chartTooltipStyle}
              formatter={(value) => [value, "Completed"]}
            />
            <Bar
              dataKey="count"
              radius={[6, 6, 6, 6]}
              maxBarSize={32}
              shape={(props: BarShapeProps) => {
                const entry = props.payload as WeekdayCountPoint;
                const isPeak = peak.count > 0 && entry.name === peak.name;
                return (
                  <Rectangle
                    {...props}
                    fill={
                      isPeak
                        ? "var(--primary)"
                        : "color-mix(in srgb, var(--primary) 22%, transparent)"
                    }
                  />
                );
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </DashboardCardScroll>
    </SectionCard>
  );
}
