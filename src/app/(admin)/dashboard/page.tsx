"use client";

import dayjs from "dayjs";
import { useWorkspaceStore } from "@/store/client/workspace";
import { useFetchTopics } from "@/store/server/topics/queries";
import { useFetchDocuments } from "@/store/server/documents/queries";
import { useFetchNotes } from "@/store/server/notes/queries";
import { useFetchStudyBlocks } from "@/store/server/study-blocks/queries";
import { FALLBACK_TOPIC_COLOR } from "@/lib/topic-colors";
import { StatTiles } from "./stat-tiles";
import { WeeklyFocusCard } from "./weekly-focus-card";
import { TopicsCard } from "./topics-card";
import { ActivityHeatmap } from "./activity-heatmap";
import { TodayTimelineWidget } from "./today-timeline-widget";
import { NotepadWidget } from "./notepad-widget";
import { LibraryWidget } from "./library-widget";

export default function DashboardPage() {
  const activeTopicId = useWorkspaceStore((s) => s.activeTopicId);

  const todayStart = dayjs().startOf("day");
  const weekStart = dayjs().startOf("week");

  const { data: todayBlocks } = useFetchStudyBlocks({
    from: todayStart.toISOString(),
    to: todayStart.add(1, "day").toISOString(),
    limit: 100,
  });
  const { data: weekBlocks } = useFetchStudyBlocks({
    from: weekStart.toISOString(),
    to: weekStart.add(7, "day").toISOString(),
    limit: 100,
  });
  const { data: topicsData } = useFetchTopics({ limit: 100 });
  const { data: documentsData } = useFetchDocuments({ limit: 100 });
  const { data: notesData } = useFetchNotes({
    limit: 4,
    topicId: activeTopicId ?? undefined,
    orderby: "UpdatedAt desc",
  });
  const { data: contextDocuments } = useFetchDocuments({
    limit: 6,
    topicId: activeTopicId ?? undefined,
    orderby: "UpdatedAt desc",
  });

  const topics = topicsData?.value ?? [];
  const activeTopic = topics.find((t) => t.Id === activeTopicId) ?? null;
  const hour = dayjs().hour();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">{greeting} 👋</h1>
        <p className="text-sm text-muted-foreground">
          {dayjs().format("dddd, MMMM D YYYY")} — here&apos;s your learning at a
          glance.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <StatTiles
          weekBlocks={weekBlocks?.value ?? []}
          documents={documentsData?.value ?? []}
        />

        <WeeklyFocusCard
          weekBlocks={weekBlocks?.value ?? []}
          topics={topics}
          className="lg:col-span-7"
        />
        <TopicsCard
          weekBlocks={weekBlocks?.value ?? []}
          documents={documentsData?.value ?? []}
          topics={topics}
          className="lg:col-span-5"
        />

        <ActivityHeatmap className="lg:col-span-12" />

        <TodayTimelineWidget
          blocks={todayBlocks?.value ?? []}
          className="lg:col-span-7"
        />
        <NotepadWidget
          topicTitle={activeTopic?.Title ?? null}
          topicColor={activeTopic?.Color ?? FALLBACK_TOPIC_COLOR}
          notes={notesData?.value ?? []}
          className="lg:col-span-5"
        />

        <LibraryWidget
          documents={contextDocuments?.value ?? []}
          contextLabel={activeTopic?.Title ?? "All topics"}
          className="lg:col-span-12"
        />
      </div>
    </div>
  );
}
