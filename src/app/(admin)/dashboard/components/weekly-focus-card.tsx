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
import { Card, CardContent } from "@/components/ui/card";
import type { StudyBlock } from "@/store/server/study-blocks/interface";
import type { Topic } from "@/store/server/topics/interface";
import { cn } from "@/lib/utils";
import {
  buildTopicSeries,
  buildWeeklyFocusData,
  chartTooltipStyle,
} from "@/utils/dashboard";
import { WidgetHeader } from "./widget-header";

export interface WeeklyFocusCardProps {
  weekBlocks: StudyBlock[];
  topics: Topic[];
  className?: string;
}

export function WeeklyFocusCard({
  weekBlocks,
  topics,
  className,
}: WeeklyFocusCardProps) {
  const series = buildTopicSeries(weekBlocks, topics);
  const data = buildWeeklyFocusData(weekBlocks, topics);

  return (
    <Card className={cn("shadow-sm", className)}>
      <WidgetHeader
        title="Weekly focus"
        href="/timeline"
        linkLabel="Open timeline"
      />
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -12 }}>
              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickFormatter={(v: number) => `${v}m`}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                contentStyle={chartTooltipStyle}
                formatter={(value) => [`${value} min`]}
              />
              {series.map((s) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  stackId="focus"
                  fill={s.color}
                  maxBarSize={32}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        {series.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {series.map((s) => (
              <span
                key={s.key}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.key}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
