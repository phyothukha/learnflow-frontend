"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import type { StudyBlock } from "@/store/server/study-blocks/interface";
import type { Topic } from "@/store/server/topics/interface";
import { FALLBACK_TOPIC_COLOR } from "@/lib/topic-colors";
import { cn } from "@/lib/utils";
import {
  NO_TOPIC_LABEL,
  blockMinutes,
  chartTooltipStyle,
  formatHours,
} from "./dashboard-utils";
import { WidgetHeader } from "./widget-header";

export function TopicsCard({
  weekBlocks,
  documents,
  topics,
  className,
}: {
  weekBlocks: StudyBlock[];
  documents: { TopicId: string; Status: string }[];
  topics: Topic[];
  className?: string;
}) {
  const doneBlocks = weekBlocks.filter((b) => b.Status === "Done");
  const totalMinutes = doneBlocks.reduce((s, b) => s + blockMinutes(b), 0);

  const donut = topics
    .map((topic) => ({
      name: topic.Title,
      color: topic.Color ?? FALLBACK_TOPIC_COLOR,
      minutes: doneBlocks
        .filter((b) => b.TopicId === topic.Id)
        .reduce((s, b) => s + blockMinutes(b), 0),
    }))
    .filter((d) => d.minutes > 0);
  const noTopicMinutes = doneBlocks
    .filter((b) => !b.TopicId)
    .reduce((s, b) => s + blockMinutes(b), 0);
  if (noTopicMinutes > 0)
    donut.push({
      name: NO_TOPIC_LABEL,
      color: FALLBACK_TOPIC_COLOR,
      minutes: noTopicMinutes,
    });

  const progress = topics
    .map((topic) => {
      const topicDocs = documents.filter((d) => d.TopicId === topic.Id);
      const done = topicDocs.filter((d) => d.Status === "Completed").length;
      return {
        ...topic,
        total: topicDocs.length,
        percent: topicDocs.length
          ? Math.round((done / topicDocs.length) * 100)
          : 0,
      };
    })
    .filter((t) => t.total > 0)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 4);

  return (
    <Card className={cn("shadow-sm", className)}>
      <WidgetHeader
        title="Focus by topic"
        href="/library"
        linkLabel="Open library"
      />
      <CardContent className="space-y-4">
        <div className="relative mx-auto h-44 w-full">
          {donut.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No completed blocks this week yet.
            </p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donut}
                    dataKey="minutes"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {donut.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    formatter={(value) => [`${value} min`]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-semibold tabular-nums">
                  {formatHours(totalMinutes)}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  this week
                </span>
              </div>
            </>
          )}
        </div>

        <div className="space-y-2.5">
          <p className="text-xs font-medium text-muted-foreground">
            Topic progress (documents completed)
          </p>
          {progress.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Add documents to topics to see progress.
            </p>
          ) : (
            progress.map((topic) => (
              <div key={topic.Id}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 truncate">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor: topic.Color ?? FALLBACK_TOPIC_COLOR,
                      }}
                    />
                    {topic.Title}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {topic.percent}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${topic.percent}%`,
                      backgroundColor: topic.Color ?? FALLBACK_TOPIC_COLOR,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
