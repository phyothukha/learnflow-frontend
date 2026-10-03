export function taskPercent(learner: {
  TasksDone: number;
  TasksTotal: number;
}) {
  return learner.TasksTotal === 0
    ? 0
    : Math.round((learner.TasksDone / learner.TasksTotal) * 100);
}
