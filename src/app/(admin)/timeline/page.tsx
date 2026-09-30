"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import type { AnimatedTab } from "@/components/animated-tabs";
import { CalendarEventContent } from "@/components/calendar-time-grid";
import { CalendarView } from "@/components/calendar-view";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/page-header";
import { ScheduleFilters } from "@/components/schedule-filters";
import { Button } from "@/components/ui/button";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import {
  STUDY_BLOCK_FALLBACK_COLOR,
  STUDY_BLOCK_STATUS,
} from "@/lib/study-block-status";
import {
  useDeleteStudyBlock,
  useUpdateStudyBlock,
} from "@/store/server/study-blocks/mutations";
import { useFetchStudyBlocks } from "@/store/server/study-blocks/queries";
import {
  StudyBlockStatus,
  type StudyBlock,
} from "@/store/server/study-blocks/interface";
import { useFetchTopics } from "@/store/server/topics/queries";
import { CalendarMode, calendarRange } from "@/utils/calendar";
import {
  StudyBlockDialog,
  type StudyBlockEditorState,
} from "./components/study-block-dialog";
import { StudyBlockPopover } from "./components/study-block-popover";

const ALL_STATUSES = "all";
const NO_TOPIC = "none";

type StatusFilter = StudyBlockStatus | typeof ALL_STATUSES;

export default function TimelinePage() {
  const router = useRouter();
  const { status } = useSession();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.SCHEDULE_VIEW);

  useEffect(() => {
    if (status === "authenticated" && !canView) router.replace("/forbidden");
  }, [status, canView, router]);

  if (status !== "authenticated" || !canView) return null;

  return <TimelineContent />;
}

function TimelineContent() {
  const [mode, setMode] = useState(CalendarMode.Week);
  const [cursor, setCursor] = useState(() => dayjs().startOf("day"));
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>(ALL_STATUSES);
  const [hiddenTopics, setHiddenTopics] = useState<Set<string>>(
    () => new Set(),
  );
  const [editor, setEditor] = useState<StudyBlockEditorState | null>(null);
  const { confirmDelete, dialogProps } = useConfirmDialog();

  const range = calendarRange(cursor, mode);
  const { data, isFetching } = useFetchStudyBlocks({
    from: range.start.toISOString(),
    to: range.end.toISOString(),
    limit: 100,
  });
  const { data: topicsData } = useFetchTopics({ limit: 100 });
  const updateBlock = useUpdateStudyBlock();
  const deleteBlock = useDeleteStudyBlock();

  const blocks = data?.value ?? [];
  const topics = (topicsData?.Items ?? []).filter((topic) => !topic.IsArchived);
  const topicsById = new Map(topics.map((topic) => [topic.Id, topic]));

  const topicKey = (block: StudyBlock) => block.TopicId ?? NO_TOPIC;
  const topicTitle = (block: StudyBlock) =>
    (block.TopicId && topicsById.get(block.TopicId)?.Title) ??
    block.Topic?.Title ??
    null;
  const colorOf = (block: StudyBlock) =>
    (block.TopicId && topicsById.get(block.TopicId)?.Color) ||
    block.Topic?.Color ||
    STUDY_BLOCK_FALLBACK_COLOR;

  const query = search.trim().toLowerCase();
  const searched = blocks.filter(
    (block) =>
      !query ||
      block.Title.toLowerCase().includes(query) ||
      topicTitle(block)?.toLowerCase().includes(query),
  );
  const visible = searched.filter(
    (block) => !hiddenTopics.has(topicKey(block)),
  );
  const filtered =
    status === ALL_STATUSES
      ? visible
      : visible.filter((block) => block.Status === status);

  const statusCounts = Map.groupBy(visible, (block) => block.Status);
  const statusTabs: AnimatedTab<StatusFilter>[] = [
    { value: ALL_STATUSES, label: "All Blocks", count: visible.length },
    ...Array.from(STUDY_BLOCK_STATUS, ([value, meta]) => ({
      value,
      label: meta.label,
      count: statusCounts.get(value)?.length ?? 0,
    })),
  ];

  const topicCounts = Map.groupBy(searched, topicKey);
  const categories = [
    ...topics.map((topic) => ({
      value: topic.Id,
      label: topic.Title,
      color: topic.Color ?? STUDY_BLOCK_FALLBACK_COLOR,
      count: topicCounts.get(topic.Id)?.length ?? 0,
    })),
    {
      value: NO_TOPIC,
      label: "No topic",
      color: STUDY_BLOCK_FALLBACK_COLOR,
      count: topicCounts.get(NO_TOPIC)?.length ?? 0,
    },
  ];

  const toggleTopic = (topic: string) =>
    setHiddenTopics((current) => {
      const next = new Set(current);
      if (!next.delete(topic)) next.add(topic);
      return next;
    });

  const openDelete = (block: StudyBlock) =>
    void confirmDelete({
      itemName: block.Title,
      onConfirm: () => deleteBlock.mutateAsync(block.Id),
      successMessage: "Study block deleted.",
      errorMessage: "Failed to delete block",
    });

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 sm:gap-4">
      <PageHeader
        title="Timeline"
        description="Plan your study blocks by day, week or month and drag them to reschedule"
        actions={
          <Button
            onClick={() => setEditor({ block: null, draft: null })}
            aria-label="New block"
            className="size-8 has-[>svg]:px-0 sm:h-10 sm:w-auto sm:has-[>svg]:px-4"
          >
            <Plus className="size-3.5 sm:size-4" />
            <span className="hidden sm:inline">New block</span>
          </Button>
        }
      />

      <div className="schedule-card">
        <ScheduleFilters
          statusTabs={statusTabs}
          status={status}
          onStatusChange={setStatus}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search blocks or topics"
          categoriesLabel="Topics"
          categories={categories}
          hiddenCategories={hiddenTopics}
          onToggleCategory={toggleTopic}
          onShowAllCategories={() => setHiddenTopics(new Set())}
        />
        <CalendarView
          mode={mode}
          onModeChange={setMode}
          cursor={cursor}
          onCursorChange={setCursor}
          status={
            isFetching && (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            )
          }
          events={filtered}
          getColor={colorOf}
          isMuted={(block) => block.Status === StudyBlockStatus.Done}
          renderPopover={(block, trigger, side) => (
            <StudyBlockPopover
              block={block}
              color={colorOf(block)}
              topicTitle={topicTitle(block)}
              side={side}
              onEdit={(target) => setEditor({ block: target, draft: null })}
              onDelete={openDelete}
            >
              {trigger}
            </StudyBlockPopover>
          )}
          renderContent={(block, state) => (
            <CalendarEventContent
              title={block.Title}
              {...state}
              subtitle={
                topicTitle(block) && (
                  <span className="truncate text-[11px] text-muted-foreground">
                    {topicTitle(block)}
                  </span>
                )
              }
            />
          )}
          onEventChange={(block, schedule) =>
            updateBlock.mutate(
              { id: block.Id, payload: schedule },
              {
                onSuccess: () => toast.success("Study block rescheduled."),
                onError: () => toast.error("Failed to reschedule block"),
              },
            )
          }
          onCreateAt={(start) =>
            setEditor({
              block: null,
              draft: {
                StartAt: start.toISOString(),
                EndAt: start.add(1, "hour").toISOString(),
              },
            })
          }
          createHint="Click an empty slot to plan a study block"
        />
      </div>

      <StudyBlockDialog
        editor={editor}
        topics={topics}
        onClose={() => setEditor(null)}
      />
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
