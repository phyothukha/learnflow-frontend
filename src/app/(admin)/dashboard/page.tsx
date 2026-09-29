"use client";

import dayjs from "dayjs";
import { useWorkspaceStore } from "@/store/client/use-store";
import { useFetchTopics } from "@/store/server/topics/queries";
import { useFetchDocuments } from "@/store/server/documents/queries";
import { useFetchNotes } from "@/store/server/notes/queries";
import { useFetchStudyBlocks } from "@/store/server/study-blocks/queries";
import { DocumentStatus } from "@/store/server/documents/interface";
import { StudyBlockStatus } from "@/store/server/study-blocks/interface";
import {
  buildFocusSeries,
  buildKpiTiles,
  buildNotePreview,
  buildTopicSegments,
  buildWeekdayData,
  calcStreak,
  donePercent,
  formatDashboardRange,
  percentChange,
  sumMinutes,
} from "@/utils/dashboard";
import { DashboardHeader } from "./components/dashboard-header";
import { StatTiles } from "./components/stat-tiles";
import { TotalFocusCard } from "./components/total-focus-card";
import { MostActiveDayCard } from "./components/most-active-day-card";
import { TopicsBreakdownCard } from "./components/topics-breakdown-card";
import { TopDocumentsCard } from "./components/top-documents-card";
import {
  AssistantCard,
  CompletionGaugeCard,
} from "./components/completion-gauge-card";

export default function DashboardPage() {
  const { activeTopicId } = useWorkspaceStore();

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
  const focusMinutes = sumMinutes(done);
  const prevFocusMinutes = sumMinutes(prevDone);

  const completedDocs = documents.filter(
    (d) => d.Status === DocumentStatus.Completed,
  ).length;
  const completionRate = documents.length
    ? Math.round((completedDocs / documents.length) * 100)
    : null;

  const adherence = donePercent(
    blocks.filter((b) => dayjs(b.StartAt).isBefore(dayjs())),
  );
  const streak = calcStreak(done);

  const kpiTiles = buildKpiTiles({
    focusMinutes,
    prevFocusMinutes,
    documentCount: documents.length,
    sessions: done.length,
    prevSessions: prevDone.length,
    adherence,
    prevAdherence: donePercent(previous),
    streak,
  });

  const focusSeries = buildFocusSeries(done, prevDone, rangeStart, prevStart);
  const weekdayData = buildWeekdayData(done);
  const mostActiveMinutes = Math.max(...weekdayData.map((d) => d.minutes), 0);
  const topicSegments = buildTopicSegments(documents, topics);
  const notePreview = buildNotePreview(notes[0]);

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
