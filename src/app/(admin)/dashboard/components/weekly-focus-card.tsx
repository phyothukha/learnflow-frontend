"use client";

import dayjs from "dayjs";
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
import { FALLBACK_TOPIC_COLOR } from "@/lib/topic-colors";
import { cn } from "@/lib/utils";
import {
  NO_TOPIC_LABEL,
  blockMinutes,
  chartTooltipStyle,
} from "./dashboard-utils";
import { WidgetHeader } from "./widget-header";

function topicSeries(weekBlocks: StudyBlock[], topics: Topic[]) {
  const used = topics.filter((t) =>
    weekBlocks.some((b) => b.TopicId === t.Id && b.Status === "Done"),
  );
  const series = used.map((t) => ({
    key: t.Title,
    color: t.Color ?? FALLBACK_TOPIC_COLOR,
  }));
  if (weekBlocks.some((b) => !b.TopicId && b.Status === "Done"))
    series.push({ key: NO_TOPIC_LABEL, color: FALLBACK_TOPIC_COLOR });
  return series;
}

export function WeeklyFocusCard({
  weekBlocks,
  topics,
  className,
}: {
  weekBlocks: StudyBlock[];
  topics: Topic[];
  className?: string;
}) {
  const weekStart = dayjs().startOf("week");
  const series = topicSeries(weekBlocks, topics);
  const topicName = (block: StudyBlock) =>
    topics.find((t) => t.Id === block.TopicId)?.Title ?? NO_TOPIC_LABEL;

  const data = Array.from({ length: 7 }, (_, i) => {
    const day = weekStart.add(i, "day");
    const row: Record<string, number | string> = { day: day.format("ddd") };
    for (const block of weekBlocks) {
      if (block.Status !== "Done") continue;
      if (!dayjs(block.StartAt).isSame(day, "day")) continue;
      const key = topicName(block);
      row[key] = ((row[key] as number) ?? 0) + blockMinutes(block);
    }
    return row;
  });

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
