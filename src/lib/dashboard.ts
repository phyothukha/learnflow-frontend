export enum DashboardPeriod {
  Last7 = "7d",
  Last14 = "14d",
  Last30 = "30d",
  Last90 = "90d",
  Custom = "custom",
}

export const DASHBOARD_PERIOD_DAYS = new Map<DashboardPeriod, number>([
  [DashboardPeriod.Last7, 7],
  [DashboardPeriod.Last14, 14],
  [DashboardPeriod.Last30, 30],
  [DashboardPeriod.Last90, 90],
]);

export const DASHBOARD_PERIOD_LABELS = new Map<DashboardPeriod, string>([
  [DashboardPeriod.Last7, "Last 7 days"],
  [DashboardPeriod.Last14, "Last 14 days"],
  [DashboardPeriod.Last30, "Last 30 days"],
  [DashboardPeriod.Last90, "Last 90 days"],
  [DashboardPeriod.Custom, "Custom range"],
]);

export const HEATMAP_WEEKS = 26;
// Sequential single-hue ramp (indigo, light→dark via alpha over the surface).
export const HEATMAP_STEPS = [0.18, 0.4, 0.65, 0.9];

export enum DashboardWidget {
  PrimaryGoal = "primary-goal",
  TodayFocus = "today-focus",
  WeeklyProgress = "weekly-progress",
  Stats = "stats",
  TotalFocus = "total-focus",
  MostActiveDay = "most-active-day",
  Topics = "topics",
  TopDocuments = "top-documents",
  Completion = "completion",
  QuickNotes = "quick-notes",
}

export const DASHBOARD_WIDGET_LABELS = new Map<DashboardWidget, string>([
  [DashboardWidget.PrimaryGoal, "Primary goal"],
  [DashboardWidget.TodayFocus, "Today's focus"],
  [DashboardWidget.WeeklyProgress, "Weekly progress"],
  [DashboardWidget.Stats, "Summary tiles"],
  [DashboardWidget.TotalFocus, "Total focus"],
  [DashboardWidget.MostActiveDay, "Most active day"],
  [DashboardWidget.Topics, "Topics"],
  [DashboardWidget.TopDocuments, "Top documents"],
  [DashboardWidget.Completion, "Study completion"],
  [DashboardWidget.QuickNotes, "Quick notes"],
]);
