"use client";

import { useState } from "react";
import dayjs from "dayjs";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlannerData } from "@/store/client/planner-seed";
import { startOfWeek } from "@/utils/calendar";
import { chartTooltipStyle } from "@/utils/dashboard";
import { formatHours } from "@/utils/format";
import { weekStats } from "@/utils/goals";
import {
  DashboardCard,
  DashboardCardScroll,
  DashboardCardValue,
} from "./dashboard-card";
import { WeeklyReviewDialog } from "./weekly-review-dialog";

const SERIES_LABELS = new Map([
  ["planned", "Planned"],
  ["actual", "Studied"],
]);

export interface WeeklyProgressCardProps {
  data: PlannerData;
  className?: string;
}

export function WeeklyProgressCard({
  data,
  className,
}: WeeklyProgressCardProps) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const stats = weekStats(startOfWeek(dayjs()), data.entries, data.sessions);
  const chartData = stats.days.map((day) => ({
    ...day,
    day: dayjs(day.date).format("dd"),
  }));

  return (
    <DashboardCard
      title="This Week"
      icon={CalendarCheck2}
      className={className}
    >
      <DashboardCardValue>{stats.completionRate}%</DashboardCardValue>
      <p className="mt-1 text-xs text-muted-foreground">
        {formatHours(stats.actualMinutes)} of{" "}
        {formatHours(stats.plannedMinutes)} planned
        {stats.missedCount > 0 && ` · ${stats.missedCount} missed`}
      </p>
      <DashboardCardScroll minWidth={240} className="mt-4 h-40 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            barGap={2}
            margin={{ top: 8, right: 4, left: 4, bottom: 0 }}
          >
            <XAxis
              dataKey="day"
              interval={0}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.5 }}
              contentStyle={chartTooltipStyle}
              formatter={(value, name) => [
                formatHours(Number(value)),
                SERIES_LABELS.get(String(name)) ?? name,
              ]}
            />
            <Bar
              dataKey="planned"
              radius={[6, 6, 6, 6]}
              maxBarSize={14}
              fill="color-mix(in srgb, var(--primary) 18%, transparent)"
            />
            <Bar
              dataKey="actual"
              radius={[6, 6, 6, 6]}
              maxBarSize={14}
              fill="var(--primary)"
            />
          </BarChart>
        </ResponsiveContainer>
      </DashboardCardScroll>
      <div className="mt-auto pt-4">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setReviewOpen(true)}
        >
          Weekly review
        </Button>
      </div>
      <WeeklyReviewDialog
        open={reviewOpen}
        data={data}
        onOpenChange={setReviewOpen}
      />
    </DashboardCard>
  );
}
