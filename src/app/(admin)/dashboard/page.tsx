"use client";

import dayjs from "dayjs";
import {
  CheckCircle2,
  FileText,
  Flame,
  MousePointerClick,
  Timer,
} from "lucide-react";
import { useWorkspaceStore } from "@/store/client/workspace";
import { useFetchTopics } from "@/store/server/topics/queries";
import { useFetchDocuments } from "@/store/server/documents/queries";
import { useFetchNotes } from "@/store/server/notes/queries";
import { useFetchStudyBlocks } from "@/store/server/study-blocks/queries";
import { DocumentStatus } from "@/store/server/documents/interface";
import { StudyBlockStatus } from "@/store/server/study-blocks/interface";
import { FALLBACK_TOPIC_COLOR } from "@/lib/utils";
import {
  DashboardHeader,
  formatDashboardRange,
} from "./components/dashboard-header";
import { StatTiles, type KpiTile } from "./components/stat-tiles";
import { TotalFocusCard } from "./components/total-focus-card";
import { MostActiveDayCard } from "./components/most-active-day-card";
import { TopicsBreakdownCard } from "./components/topics-breakdown-card";
import { TopDocumentsCard } from "./components/top-documents-card";
import {
  AssistantCard,
  CompletionGaugeCard,
} from "./components/completion-gauge-card";
import { blockMinutes, formatHours } from "./components/dashboard-utils";

function percentChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

export default function DashboardPage() {
  const activeTopicId = useWorkspaceStore((s) => s.activeTopicId);

  const rangeEnd = dayjs().endOf("day");
  const rangeStart = dayjs().subtract(29, "day").startOf("day");
  const prevStart = rangeStart.subtract(30, "day");
  const prevEnd = rangeStart;

  const { data: periodBlocks } = useFetchStudyBlocks({
    from: rangeStart.toISOString(),
    to: rangeEnd.add(1, "millisecond").toISOString(),
    limit: 500,
  });
  const { data: prevBlocks } = useFetchStudyBlocks({
    from: prevStart.toISOString(),
    to: prevEnd.toISOString(),
    limit: 500,
  });
  const { data: topicsData } = useFetchTopics({ limit: 100 });
  const { data: documentsData } = useFetchDocuments({ limit: 100 });
  const { data: notesData } = useFetchNotes({
    limit: 4,
    topicId: activeTopicId ?? undefined,
  });

  const topics = topicsData?.Items ?? [];
  const documents = documentsData?.Items ?? [];
  const notes = notesData?.Items ?? [];
  const blocks = periodBlocks?.value ?? [];
  const previous = prevBlocks?.value ?? [];
  const activeTopic = topics.find((t) => t.Id === activeTopicId) ?? null;

  const done = blocks.filter((b) => b.Status === StudyBlockStatus.Done);
  const prevDone = previous.filter((b) => b.Status === StudyBlockStatus.Done);
  const focusMinutes = done.reduce((sum, b) => sum + blockMinutes(b), 0);
  const prevFocusMinutes = prevDone.reduce(
    (sum, b) => sum + blockMinutes(b),
    0,
  );

  const completedDocs = documents.filter(
    (d) => d.Status === DocumentStatus.Completed,
  ).length;
  const completionRate = documents.length
    ? Math.round((completedDocs / documents.length) * 100)
    : null;

  const pastBlocks = blocks.filter((b) => dayjs(b.StartAt).isBefore(dayjs()));
  const adherence = pastBlocks.length
    ? Math.round(
        (pastBlocks.filter((b) => b.Status === StudyBlockStatus.Done).length /
          pastBlocks.length) *
          100,
      )
    : null;

  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const day = dayjs().startOf("day").subtract(i, "day");
    const hasDone = done.some((b) => dayjs(b.StartAt).isSame(day, "day"));
    if (hasDone) streak++;
    else if (i > 0) break;
  }

  const kpiTiles: KpiTile[] = [
    {
      title: "Focus time",
      value: formatHours(focusMinutes),
      change: percentChange(focusMinutes, prevFocusMinutes),
      icon: Timer,
    },
    {
      title: "Documents",
      value: documents.length.toLocaleString(),
      change: null,
      icon: FileText,
    },
    {
      title: "Study sessions",
      value: done.length.toLocaleString(),
      change: percentChange(done.length, prevDone.length),
      icon: MousePointerClick,
    },
    adherence === null
      ? {
          title: "Streak",
          value: `${streak} day${streak === 1 ? "" : "s"}`,
          change: null,
          icon: Flame,
        }
      : {
          title: "Adherence",
          value: `${adherence}%`,
          change: percentChange(
            adherence,
            previous.length
              ? Math.round(
                  (previous.filter((b) => b.Status === StudyBlockStatus.Done)
                    .length /
                    previous.length) *
                    100,
                )
              : 0,
          ),
          icon: CheckCircle2,
        },
  ];

  const focusSeries = Array.from({ length: 30 }, (_, i) => {
    const day = rangeStart.add(i, "day");
    const prevDay = prevStart.add(i, "day");
    const current = done
      .filter((b) => dayjs(b.StartAt).isSame(day, "day"))
      .reduce((sum, b) => sum + blockMinutes(b), 0);
    const prev = prevDone
      .filter((b) => dayjs(b.StartAt).isSame(prevDay, "day"))
      .reduce((sum, b) => sum + blockMinutes(b), 0);
    return {
      label: day.format("MMM D"),
      current,
      previous: prev,
    };
  });

  const weekdayData = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
    (day, index) => ({
      day,
      minutes: done
        .filter((b) => dayjs(b.StartAt).day() === index)
        .reduce((sum, b) => sum + blockMinutes(b), 0),
    }),
  );
  const mostActiveMinutes = Math.max(...weekdayData.map((d) => d.minutes), 0);

  const docCountByTopic = new Map<string, number>();
  for (const doc of documents) {
    docCountByTopic.set(
      doc.TopicId,
      (docCountByTopic.get(doc.TopicId) ?? 0) + 1,
    );
  }

  const topicSegments = topics
    .map((topic) => ({
      name: topic.Title,
      count: docCountByTopic.get(topic.Id) ?? 0,
      color: topic.Color ?? FALLBACK_TOPIC_COLOR,
    }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  if (topicSegments.length === 0 && topics.length > 0) {
    topicSegments.push(
      ...topics.slice(0, 3).map((topic) => ({
        name: topic.Title,
        count: 1,
        color: topic.Color ?? FALLBACK_TOPIC_COLOR,
      })),
    );
  }

  const notePreview = notes[0]
    ? notes[0].Content?.replace(/[#>*_`\-\[\]]/g, "")
        .trim()
        .slice(0, 180) || notes[0].Title
    : null;

  return (
    <div className="space-y-5">
      <DashboardHeader
        rangeLabel={formatDashboardRange(rangeStart, rangeEnd)}
      />

      <StatTiles tiles={kpiTiles} />

      <div className="grid gap-4 xl:grid-cols-12">
        <TotalFocusCard
          className="xl:col-span-8"
          totalMinutes={focusMinutes}
          change={percentChange(focusMinutes, prevFocusMinutes)}
          data={focusSeries}
        />
        <MostActiveDayCard
          className="xl:col-span-4"
          totalLabel={
            mostActiveMinutes > 0 ? mostActiveMinutes.toLocaleString() : "0"
          }
          data={weekdayData}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <TopicsBreakdownCard
          className="xl:col-span-3"
          segments={topicSegments}
        />
        <TopDocumentsCard className="xl:col-span-5" documents={documents} />
        <div className="grid min-w-0 gap-4 xl:col-span-4">
          <CompletionGaugeCard rate={completionRate ?? adherence} />
          <AssistantCard
            topicTitle={activeTopic?.Title ?? null}
            notePreview={notePreview}
          />
        </div>
      </div>
    </div>
  );
}
