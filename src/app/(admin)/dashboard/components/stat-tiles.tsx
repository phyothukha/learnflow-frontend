"use client";

import dayjs from "dayjs";
import { CheckCircle, Flame, Target, Timer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { StudyBlock } from "@/store/server/study-blocks/interface";
import { TOPIC_COLORS } from "@/lib/topic-colors";
import { blockMinutes, formatHours } from "./dashboard-utils";

export function StatTiles({
  weekBlocks,
  documents,
}: {
  weekBlocks: StudyBlock[];
  documents: { Status: string }[];
}) {
  const doneBlocks = weekBlocks.filter((b) => b.Status === "Done");
  const focusMinutes = doneBlocks.reduce((sum, b) => sum + blockMinutes(b), 0);
  const pastBlocks = weekBlocks.filter((b) =>
    dayjs(b.StartAt).isBefore(dayjs()),
  );
  const adherence = pastBlocks.length
    ? Math.round(
        (pastBlocks.filter((b) => b.Status === "Done").length /
          pastBlocks.length) *
          100,
      )
    : null;
  const completedDocs = documents.filter(
    (d) => d.Status === "Completed",
  ).length;
  const completionRate = documents.length
    ? Math.round((completedDocs / documents.length) * 100)
    : null;

  let streak = 0;
  for (let i = 0; i < 7; i++) {
    const day = dayjs().startOf("day").subtract(i, "day");
    const hasDone = doneBlocks.some((b) => dayjs(b.StartAt).isSame(day, "day"));
    if (hasDone) streak++;
    else if (i > 0) break;
  }

  const tiles = [
    {
      title: "Focus time",
      sub: "this week",
      value: formatHours(focusMinutes),
      icon: Timer,
      color: TOPIC_COLORS[0],
    },
    {
      title: "Study streak",
      sub: "consecutive days",
      value: `${streak} day${streak === 1 ? "" : "s"}`,
      icon: Flame,
      color: TOPIC_COLORS[3],
    },
    {
      title: "Doc completion",
      sub: `${completedDocs} of ${documents.length} documents`,
      value: completionRate === null ? "—" : `${completionRate}%`,
      icon: CheckCircle,
      color: TOPIC_COLORS[2],
    },
    {
      title: "Adherence",
      sub: "blocks completed on plan",
      value: adherence === null ? "—" : `${adherence}%`,
      icon: Target,
      color: TOPIC_COLORS[1],
    },
  ];

  return (
    <>
      {tiles.map((tile) => (
        <Card key={tile.title} className="shadow-sm lg:col-span-3">
          <CardContent className="flex items-center gap-3 py-4">
            <div
              className="flex size-11 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${tile.color}1f`, color: tile.color }}
            >
              <tile.icon className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">
                {tile.title}
              </p>
              <p className="text-2xl font-semibold leading-tight tabular-nums">
                {tile.value}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {tile.sub}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
