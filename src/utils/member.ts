export function taskPercent(member: { TasksDone: number; TasksTotal: number }) {
  return member.TasksTotal === 0
    ? 0
    : Math.round((member.TasksDone / member.TasksTotal) * 100);
}
