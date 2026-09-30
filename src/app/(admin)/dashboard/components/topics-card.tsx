"use client";

import {
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
  type PieSectorShapeProps,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import {
  StudyBlockStatus,
  type StudyBlock,
} from "@/store/server/study-blocks/interface";
import type { Topic } from "@/store/server/topics/interface";
import { cn } from "@/lib/utils";
import { FALLBACK_TOPIC_COLOR } from "@/utils/colors";
import { formatHours } from "@/utils/format";
import {
  buildTopicDonut,
  buildTopicProgress,
  chartTooltipStyle,
  sumMinutes,
  type TopicDocument,
  type TopicDonutSlice,
} from "@/utils/dashboard";
import { WidgetHeader } from "./widget-header";

export interface TopicsCardProps {
  weekBlocks: StudyBlock[];
  documents: TopicDocument[];
  topics: Topic[];
  className?: string;
}

export function TopicsCard({
  weekBlocks,
  documents,
  topics,
  className,
}: TopicsCardProps) {
  const doneBlocks = weekBlocks.filter(
    (b) => b.Status === StudyBlockStatus.Done,
  );
  const totalMinutes = sumMinutes(doneBlocks);
  const donut = buildTopicDonut(doneBlocks, topics);
  const progress = buildTopicProgress(documents, topics);

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
                    shape={(props: PieSectorShapeProps) => (
                      <Sector
                        {...props}
                        fill={(props.payload as TopicDonutSlice).color}
                      />
                    )}
                  />
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
