"use client";

import {
  Fragment,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import dayjs from "dayjs";
import { LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import {
  DASHBOARD_PERIOD_DAYS,
  DashboardPeriod,
  DashboardWidget,
} from "@/lib/dashboard";
import { useWorkspaceStore } from "@/store/client/use-store";
import { useFetchTopics } from "@/store/server/topics/queries";
import { useFetchDocuments } from "@/store/server/documents/queries";
import { useFetchNotes } from "@/store/server/notes/queries";
import { useFetchStudyBlocks } from "@/store/server/study-blocks/queries";
import { DocumentStatus } from "@/store/server/documents/interface";
import { StudyBlockStatus } from "@/store/server/study-blocks/interface";
import {
  buildDashboardCsv,
  buildFocusSeries,
  buildKpiTiles,
  buildNotePreview,
  buildTopicSegments,
  buildWeekdayData,
  calcStreak,
  dashboardGridTemplate,
  donePercent,
  formatDashboardRange,
  percentChange,
  sumMinutes,
} from "@/utils/dashboard";
import { downloadText } from "@/utils/file";
import {
  DashboardHeader,
  type DashboardRange,
} from "./components/dashboard-header";
import { StatTiles } from "./components/stat-tiles";
import { TotalFocusCard } from "./components/total-focus-card";
import { MostActiveDayCard } from "./components/most-active-day-card";
import { TopicsBreakdownCard } from "./components/topics-breakdown-card";
import { TopDocumentsCard } from "./components/top-documents-card";
import {
  AssistantCard,
  CompletionGaugeCard,
} from "./components/completion-gauge-card";
import { Button } from "@/components/ui/button";

const DEFAULT_PERIOD = DashboardPeriod.Last30;

interface DashboardRowItem {
  key: string;
  weight: number;
  visible: boolean;
  node: ReactNode;
}

interface DashboardRowProps {
  items: DashboardRowItem[];
}

function subscribeNoop() {
  return () => {};
}

function presetRange(period: DashboardPeriod): DashboardRange {
  const days = DASHBOARD_PERIOD_DAYS.get(period) ?? 30;
  return {
    from: dayjs()
      .subtract(days - 1, "day")
      .startOf("day"),
    to: dayjs().endOf("day"),
  };
}

function DashboardRow({ items }: DashboardRowProps) {
  const visible = items.filter((item) => item.visible);
  if (visible.length === 0) return null;
  return (
    <div
      className="grid gap-4 xl:grid-cols-(--dashboard-cols)"
      style={
        {
          "--dashboard-cols": dashboardGridTemplate(
            visible.map((item) => item.weight),
          ),
        } as React.CSSProperties
      }
    >
      {visible.map((item) => (
        <Fragment key={item.key}>{item.node}</Fragment>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { activeTopicId, hiddenWidgets, toggleWidget, showAllWidgets } =
    useWorkspaceStore();
  const hydrated = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const [period, setPeriod] = useState(DEFAULT_PERIOD);
  const [range, setRange] = useState(() => presetRange(DEFAULT_PERIOD));

  const days = range.to.diff(range.from, "day") + 1;
  const prevStart = range.from.subtract(days, "day");
  const prevEnd = range.from;

  const { data: periodBlocks } = useFetchStudyBlocks({
    from: range.from.toISOString(),
    to: range.to.add(1, "millisecond").toISOString(),
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
  const streak = calcStreak(done, days);

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

  const rangeLabel = formatDashboardRange(range.from, range.to);
  const focusSeries = buildFocusSeries(
    done,
    prevDone,
    range.from,
    prevStart,
    days,
  );
  const weekdayData = buildWeekdayData(done);
  const mostActiveMinutes = Math.max(...weekdayData.map((d) => d.minutes), 0);
  const topicSegments = buildTopicSegments(documents, topics);
  const notePreview = buildNotePreview(notes[0]);

  const hidden = new Set(hydrated ? hiddenWidgets : []);
  const isVisible = (widget: DashboardWidget) => !hidden.has(widget);
  const allHidden = Object.values(DashboardWidget).every(
    (widget) => !isVisible(widget),
  );

  function handlePeriodChange(next: DashboardPeriod) {
    setPeriod(next);
    setRange(presetRange(next));
  }

  function handleRangeChange(next: DashboardRange) {
    setPeriod(DashboardPeriod.Custom);
    setRange(next);
  }

  function handleExport() {
    downloadText(
      buildDashboardCsv({
        rangeLabel,
        tiles: kpiTiles,
        focusSeries,
        weekdayData,
        documents,
      }),
      `learnflow-dashboard-${range.from.format("YYYY-MM-DD")}-${range.to.format("YYYY-MM-DD")}.csv`,
      "text/csv;charset=utf-8",
    );
    toast.success("Dashboard exported.");
  }

  return (
    <div className="space-y-5">
      <DashboardHeader
        period={period}
        range={range}
        rangeLabel={rangeLabel}
        hiddenWidgets={hydrated ? hiddenWidgets : []}
        onPeriodChange={handlePeriodChange}
        onRangeChange={handleRangeChange}
        onToggleWidget={toggleWidget}
        onShowAllWidgets={showAllWidgets}
        onExport={handleExport}
      />

      {isVisible(DashboardWidget.Stats) && <StatTiles tiles={kpiTiles} />}

      <DashboardRow
        items={[
          {
            key: DashboardWidget.TotalFocus,
            weight: 8,
            visible: isVisible(DashboardWidget.TotalFocus),
            node: (
              <TotalFocusCard
                totalMinutes={focusMinutes}
                change={percentChange(focusMinutes, prevFocusMinutes)}
                data={focusSeries}
              />
            ),
          },
          {
            key: DashboardWidget.MostActiveDay,
            weight: 4,
            visible: isVisible(DashboardWidget.MostActiveDay),
            node: (
              <MostActiveDayCard
                totalLabel={
                  mostActiveMinutes > 0
                    ? mostActiveMinutes.toLocaleString()
                    : "0"
                }
                data={weekdayData}
              />
            ),
          },
        ]}
      />

      <DashboardRow
        items={[
          {
            key: DashboardWidget.Topics,
            weight: 3,
            visible: isVisible(DashboardWidget.Topics),
            node: <TopicsBreakdownCard segments={topicSegments} />,
          },
          {
            key: DashboardWidget.TopDocuments,
            weight: 5,
            visible: isVisible(DashboardWidget.TopDocuments),
            node: <TopDocumentsCard documents={documents} />,
          },
          {
            key: "side",
            weight: 4,
            visible:
              isVisible(DashboardWidget.Completion) ||
              isVisible(DashboardWidget.QuickNotes),
            node: (
              <div className="grid min-w-0 gap-4">
                {isVisible(DashboardWidget.Completion) && (
                  <CompletionGaugeCard rate={completionRate ?? adherence} />
                )}
                {isVisible(DashboardWidget.QuickNotes) && (
                  <AssistantCard
                    topicTitle={activeTopic?.Title ?? null}
                    notePreview={notePreview}
                  />
                )}
              </div>
            ),
          },
        ]}
      />

      {allHidden && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
          <LayoutGrid className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            All widgets are hidden.
          </p>
          <Button onClick={showAllWidgets}>Show all widgets</Button>
        </div>
      )}
    </div>
  );
}
