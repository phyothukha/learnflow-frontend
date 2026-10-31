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
} from "@/utils/constants";
import { useWorkspaceStore } from "@/store/client/use-store";
import { useFetchStudyBlocks } from "@/store/server/study-blocks/queries";
import { StudyBlockStatus } from "@/store/server/study-blocks/interface";
import {
  MemberStatus,
  useMembersStore,
} from "@/store/client/mock/members-store";
import {
  buildDashboardCsv,
  buildKpiTiles,
  buildTaskOutcomeSeries,
  buildWeekdayCompleted,
  completionRate,
  dashboardGridTemplate,
  formatDashboardRange,
  seriesCounts,
  taskCounts,
} from "@/utils/dashboard";
import { downloadText } from "@/utils/file";
import {
  DashboardHeader,
  type DashboardRange,
} from "./components/dashboard-header";
import { StatTiles } from "./components/stat-tiles";
import { CompletedMissedCard } from "./components/completed-missed-card";
import { MostActiveDayCard } from "./components/most-active-day-card";
import { MissedOutcomesCard } from "./components/missed-outcomes-card";
import { MissedEventsCard } from "./components/missed-events-card";
import { GoalTemplatesCard } from "./components/goal-templates-card";
import {
  MISSED_OUTCOME_META,
  createFakeGoalTemplates,
  createFakeMissedEvents,
  createFakeOutcomeCounts,
  createFakeTaskOutcomeSeries,
  createFakeWeekdayCompleted,
} from "./data/fake-activity";
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
  const { hiddenWidgets, toggleWidget, showAllWidgets } = useWorkspaceStore();
  const members = useMembersStore((state) => state.members);
  const hydrated = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const [period, setPeriod] = useState(DEFAULT_PERIOD);
  const [range, setRange] = useState(() => presetRange(DEFAULT_PERIOD));
  const [outcomeCounts] = useState(createFakeOutcomeCounts);
  const [missedEvents] = useState(createFakeMissedEvents);
  const [goalTemplates] = useState(createFakeGoalTemplates);

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

  const blocks = periodBlocks?.value ?? [];
  const previous = prevBlocks?.value ?? [];

  const activeMembers = members.filter(
    (member) => member.Status === MemberStatus.Active,
  );
  const activeMembersAtStart = activeMembers.filter((member) =>
    dayjs(member.JoinedAt).isBefore(range.from),
  );
  const activeGoals = activeMembers.reduce(
    (sum, member) => sum + member.ActiveGoals,
    0,
  );

  const done = blocks.filter((b) => b.Status === StudyBlockStatus.Done);

  // No decided tasks yet (empty API): show a sample so charts and tiles keep their shape.
  const isSample = !blocks.some(
    (b) =>
      b.Status === StudyBlockStatus.Done ||
      b.Status === StudyBlockStatus.Missed,
  );
  const outcomeSeries = isSample
    ? createFakeTaskOutcomeSeries(range.from, days)
    : buildTaskOutcomeSeries(blocks, range.from, days);
  const weekdayData = isSample
    ? createFakeWeekdayCompleted()
    : buildWeekdayCompleted(done);
  const counts = isSample ? seriesCounts(outcomeSeries) : taskCounts(blocks);
  const prevCounts = isSample
    ? seriesCounts(createFakeTaskOutcomeSeries(prevStart, days, 1))
    : taskCounts(previous);

  const kpiTiles = buildKpiTiles({
    activeMembers: activeMembers.length,
    prevActiveMembers: activeMembersAtStart.length,
    activeGoals,
    completionRate: completionRate(counts),
    prevCompletionRate: completionRate(prevCounts),
    missedTasks: counts.missed,
    prevMissedTasks: prevCounts.missed,
  });

  const rangeLabel = formatDashboardRange(range.from, range.to);

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
        outcomeSeries,
        weekdayData,
        outcomes: outcomeCounts.map((item) => ({
          label: MISSED_OUTCOME_META.get(item.Outcome)?.label ?? item.Outcome,
          count: item.Count,
        })),
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
            key: DashboardWidget.TaskOutcomes,
            weight: 8,
            visible: isVisible(DashboardWidget.TaskOutcomes),
            node: (
              <CompletedMissedCard data={outcomeSeries} isSample={isSample} />
            ),
          },
          {
            key: DashboardWidget.MostActiveDay,
            weight: 4,
            visible: isVisible(DashboardWidget.MostActiveDay),
            node: <MostActiveDayCard data={weekdayData} isSample={isSample} />,
          },
        ]}
      />

      <DashboardRow
        items={[
          {
            key: DashboardWidget.MissedOutcomes,
            weight: 4,
            visible: isVisible(DashboardWidget.MissedOutcomes),
            node: <MissedOutcomesCard outcomes={outcomeCounts} />,
          },
          {
            key: DashboardWidget.MissedEvents,
            weight: 4,
            visible: isVisible(DashboardWidget.MissedEvents),
            node: <MissedEventsCard events={missedEvents} />,
          },
          {
            key: DashboardWidget.GoalTemplates,
            weight: 4,
            visible: isVisible(DashboardWidget.GoalTemplates),
            node: <GoalTemplatesCard templates={goalTemplates} />,
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
