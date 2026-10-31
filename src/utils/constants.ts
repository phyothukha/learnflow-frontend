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
  Stats = "stats",
  TaskOutcomes = "task-outcomes",
  MostActiveDay = "most-active-day",
  MissedOutcomes = "missed-outcomes",
  MissedEvents = "missed-events",
  GoalTemplates = "goal-templates",
}

export const DASHBOARD_WIDGET_LABELS = new Map<DashboardWidget, string>([
  [DashboardWidget.Stats, "Summary tiles"],
  [DashboardWidget.TaskOutcomes, "Completed vs missed tasks"],
  [DashboardWidget.MostActiveDay, "Most active day"],
  [DashboardWidget.MissedOutcomes, "Missed-task outcomes"],
  [DashboardWidget.MissedEvents, "Recent missed-task events"],
  [DashboardWidget.GoalTemplates, "Top goal templates"],
]);
