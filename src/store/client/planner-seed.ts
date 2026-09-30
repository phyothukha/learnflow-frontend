import dayjs from "dayjs";
import { TaskPriority } from "@/store/server/tasks/interface";
import {
  GoalCategory,
  GoalFocus,
  GoalStatus,
  GoalTaskStatus,
  MilestoneStatus,
  PreferredTime,
  ReviewMood,
  ScheduleEntryStatus,
  type AvailabilityWindow,
  type FocusSession,
  type Goal,
  type GoalTask,
  type Milestone,
  type PlannerSettings,
  type ScheduleEntry,
  type WeeklyReview,
} from "@/store/server/goals/interface";
import { startOfWeek } from "@/utils/calendar";
import { DATE_KEY } from "@/utils/scheduler";

export interface PlannerData {
  goals: Goal[];
  milestones: Milestone[];
  tasks: GoalTask[];
  availability: AvailabilityWindow[];
  settings: PlannerSettings;
  entries: ScheduleEntry[];
  sessions: FocusSession[];
  reviews: WeeklyReview[];
}

interface TaskSeed {
  id: string;
  milestone: string;
  title: string;
  minutes: number;
  priority: TaskPriority;
  /** Days from today. */
  due?: number;
  time?: PreferredTime;
  deps?: string[];
  done?: boolean;
}

interface EntrySeed {
  id: string;
  task: string;
  /** Days from today. */
  day: number;
  start: string;
  end: string;
  status: ScheduleEntryStatus;
  part?: [number, number];
}

/** Checklist per task; a leading "x " marks the step as done. */
const TASK_STEPS = new Map<string, string[]>([
  ["t-j1", ["x Learn あ–そ rows", "x Learn た–ん rows", "x Writing drill"]],
  [
    "t-j5",
    ["x Kanji 1–50 flashcards", "Kanji 51–100 flashcards", "Self-test quiz"],
  ],
  [
    "t-j6",
    ["Kanji 101–150 flashcards", "Kanji 151–200 flashcards", "Self-test quiz"],
  ],
  [
    "t-j7",
    [
      "Read chapters 1–2",
      "Read chapters 3–5",
      "Workbook exercises",
      "Review mistakes",
    ],
  ],
  ["t-j8", ["Listen to 3 dialogues", "Shadow each twice", "Answer questions"]],
  ["t-j10", ["Pick one article", "Shadow 3 times", "Note new words"]],
  ["t-f1", ["x Binary & hex", "x Boolean logic", "x Practice set"]],
  [
    "t-f2",
    [
      "x Arrays & linked lists",
      "Stacks & queues",
      "Sorting algorithms",
      "Practice questions",
    ],
  ],
  ["t-f3", ["OSI model", "TCP/IP & ports", "Practice questions"]],
  ["t-f5", ["Encryption basics", "Common attacks", "Practice questions"]],
]);

const TASKS: TaskSeed[] = [
  {
    id: "t-j1",
    milestone: "m-j1",
    title: "Master hiragana",
    minutes: 120,
    priority: TaskPriority.High,
    done: true,
  },
  {
    id: "t-j2",
    milestone: "m-j1",
    title: "Master katakana",
    minutes: 120,
    priority: TaskPriority.High,
    done: true,
  },
  {
    id: "t-j3",
    milestone: "m-j2",
    title: "N5 vocabulary (800 words)",
    minutes: 300,
    priority: TaskPriority.Medium,
    done: true,
  },
  {
    id: "t-j4",
    milestone: "m-j2",
    title: "N5 grammar review",
    minutes: 180,
    priority: TaskPriority.Medium,
    done: true,
  },
  {
    id: "t-j5",
    milestone: "m-j3",
    title: "N4 kanji set 1 (100 kanji)",
    minutes: 240,
    priority: TaskPriority.High,
    done: true,
  },
  {
    id: "t-j6",
    milestone: "m-j3",
    title: "N4 kanji set 2 (100 kanji)",
    minutes: 240,
    priority: TaskPriority.High,
    due: 10,
    time: PreferredTime.Evening,
    deps: ["t-j5"],
  },
  {
    id: "t-j7",
    milestone: "m-j3",
    title: "N4 grammar chapters 1–5",
    minutes: 180,
    priority: TaskPriority.High,
    due: 7,
  },
  {
    id: "t-j8",
    milestone: "m-j3",
    title: "N4 listening practice",
    minutes: 90,
    priority: TaskPriority.Medium,
    due: 12,
    time: PreferredTime.Morning,
  },
  {
    id: "t-j9",
    milestone: "m-j3",
    title: "N4 full mock test",
    minutes: 120,
    priority: TaskPriority.High,
    due: 20,
    deps: ["t-j6", "t-j7", "t-j8"],
  },
  {
    id: "t-j10",
    milestone: "m-j3",
    title: "Shadowing: NHK Easy news",
    minutes: 45,
    priority: TaskPriority.Low,
    time: PreferredTime.Morning,
  },
  {
    id: "t-j11",
    milestone: "m-j4",
    title: "N3 vocabulary deck",
    minutes: 360,
    priority: TaskPriority.Medium,
    due: 60,
    deps: ["t-j9"],
  },
  {
    id: "t-f1",
    milestone: "m-f1",
    title: "Number systems & logic",
    minutes: 90,
    priority: TaskPriority.High,
    done: true,
  },
  {
    id: "t-f2",
    milestone: "m-f1",
    title: "Data structures & algorithms",
    minutes: 180,
    priority: TaskPriority.Urgent,
    due: 6,
  },
  {
    id: "t-f3",
    milestone: "m-f1",
    title: "Networking basics",
    minutes: 120,
    priority: TaskPriority.High,
    due: 9,
  },
  {
    id: "t-f4",
    milestone: "m-f1",
    title: "Databases & SQL",
    minutes: 120,
    priority: TaskPriority.Medium,
    due: 14,
    deps: ["t-f2"],
  },
  {
    id: "t-f5",
    milestone: "m-f1",
    title: "Security fundamentals",
    minutes: 90,
    priority: TaskPriority.Medium,
    due: 16,
  },
  {
    id: "t-f6",
    milestone: "m-f2",
    title: "Project management",
    minutes: 90,
    priority: TaskPriority.Medium,
    due: 30,
  },
  {
    id: "t-f7",
    milestone: "m-f2",
    title: "Business strategy",
    minutes: 60,
    priority: TaskPriority.Low,
    due: 35,
  },
  {
    id: "t-f8",
    milestone: "m-f3",
    title: "Past paper: 2024 Spring",
    minutes: 150,
    priority: TaskPriority.High,
    due: 60,
    deps: ["t-f2", "t-f3", "t-f4", "t-f5"],
  },
  {
    id: "t-r1",
    milestone: "m-r2",
    title: "Portfolio layout",
    minutes: 120,
    priority: TaskPriority.Medium,
  },
  {
    id: "t-r2",
    milestone: "m-r2",
    title: "Deploy to Vercel",
    minutes: 30,
    priority: TaskPriority.Low,
    deps: ["t-r1"],
  },
];

const ENTRIES: EntrySeed[] = [
  {
    id: "e-1",
    task: "t-j5",
    day: -9,
    start: "20:00",
    end: "21:30",
    status: ScheduleEntryStatus.Done,
    part: [1, 3],
  },
  {
    id: "e-2",
    task: "t-j5",
    day: -8,
    start: "20:00",
    end: "21:30",
    status: ScheduleEntryStatus.Done,
    part: [2, 3],
  },
  {
    id: "e-3",
    task: "t-j5",
    day: -7,
    start: "20:00",
    end: "21:00",
    status: ScheduleEntryStatus.Done,
    part: [3, 3],
  },
  {
    id: "e-4",
    task: "t-f1",
    day: -2,
    start: "20:00",
    end: "21:30",
    status: ScheduleEntryStatus.Done,
  },
  {
    id: "e-5",
    task: "t-j8",
    day: -3,
    start: "20:00",
    end: "21:30",
    status: ScheduleEntryStatus.Missed,
  },
  {
    id: "e-6",
    task: "t-j10",
    day: -1,
    start: "20:00",
    end: "20:45",
    status: ScheduleEntryStatus.Missed,
  },
  {
    id: "e-7",
    task: "t-f2",
    day: 0,
    start: "20:00",
    end: "21:30",
    status: ScheduleEntryStatus.Planned,
    part: [1, 2],
  },
  {
    id: "e-8",
    task: "t-f2",
    day: 1,
    start: "20:00",
    end: "21:30",
    status: ScheduleEntryStatus.Planned,
    part: [2, 2],
  },
];

export function createPlannerSeed(): PlannerData {
  const today = dayjs().startOf("day");
  const date = (days: number) => today.add(days, "day").format(DATE_KEY);
  const monday = startOfWeek(today);

  const goals: Goal[] = [
    {
      Id: "g-jlpt",
      Title: "Pass JLPT N2",
      Description: "Reach business-level Japanese for work in Japan.",
      Category: GoalCategory.Language,
      CurrentLevel: "N5",
      TargetLevel: "N2",
      StartDate: date(-60),
      TargetDate: date(300),
      Priority: TaskPriority.High,
      Status: GoalStatus.Active,
      Focus: GoalFocus.Primary,
      Color: "#3a5bf0",
      CreatedAt: today.subtract(60, "day").toISOString(),
    },
    {
      Id: "g-fe",
      Title: "Pass ITPEC FE exam",
      Description: "Fundamental IT Engineer certification.",
      Category: GoalCategory.Certification,
      CurrentLevel: "Beginner",
      TargetLevel: "Certified",
      StartDate: date(-30),
      TargetDate: date(120),
      Priority: TaskPriority.High,
      Status: GoalStatus.Active,
      Focus: GoalFocus.Secondary,
      Color: "#10b981",
      CreatedAt: today.subtract(30, "day").toISOString(),
    },
    {
      Id: "g-react",
      Title: "Build a React portfolio",
      Description: null,
      Category: GoalCategory.Programming,
      CurrentLevel: null,
      TargetLevel: null,
      StartDate: date(-90),
      TargetDate: date(60),
      Priority: TaskPriority.Medium,
      Status: GoalStatus.Paused,
      Focus: GoalFocus.None,
      Color: "#8b5cf6",
      CreatedAt: today.subtract(90, "day").toISOString(),
    },
  ];

  const milestone = (
    Id: string,
    GoalId: string,
    Sequence: number,
    Title: string,
    Weight: number,
    Status: MilestoneStatus,
    target: number,
  ): Milestone => ({
    Id,
    GoalId,
    Sequence,
    Title,
    Description: null,
    StartDate: null,
    TargetDate: date(target),
    Weight,
    Status,
  });

  const milestones: Milestone[] = [
    milestone(
      "m-j1",
      "g-jlpt",
      1,
      "Foundation: kana",
      10,
      MilestoneStatus.Completed,
      -45,
    ),
    milestone(
      "m-j2",
      "g-jlpt",
      2,
      "N5 level",
      15,
      MilestoneStatus.Completed,
      -10,
    ),
    milestone(
      "m-j3",
      "g-jlpt",
      3,
      "N4 level",
      20,
      MilestoneStatus.InProgress,
      30,
    ),
    milestone(
      "m-j4",
      "g-jlpt",
      4,
      "N3 level",
      25,
      MilestoneStatus.NotStarted,
      150,
    ),
    milestone(
      "m-j5",
      "g-jlpt",
      5,
      "N2 level",
      30,
      MilestoneStatus.NotStarted,
      300,
    ),
    milestone(
      "m-f1",
      "g-fe",
      1,
      "Technology fundamentals",
      40,
      MilestoneStatus.InProgress,
      20,
    ),
    milestone(
      "m-f2",
      "g-fe",
      2,
      "Management & strategy",
      25,
      MilestoneStatus.NotStarted,
      45,
    ),
    milestone(
      "m-f3",
      "g-fe",
      3,
      "Past papers & mock exams",
      35,
      MilestoneStatus.NotStarted,
      110,
    ),
    milestone(
      "m-r1",
      "g-react",
      1,
      "Core concepts",
      50,
      MilestoneStatus.Completed,
      -20,
    ),
    milestone(
      "m-r2",
      "g-react",
      2,
      "Portfolio project",
      50,
      MilestoneStatus.NotStarted,
      60,
    ),
  ];

  const tasks: GoalTask[] = TASKS.map((seed) => ({
    Id: seed.id,
    MilestoneId: seed.milestone,
    Title: seed.title,
    Description: null,
    EstimatedMinutes: seed.minutes,
    Priority: seed.priority,
    DueDate: seed.due === undefined ? null : date(seed.due),
    PreferredTime: seed.time ?? null,
    DependsOnIds: seed.deps ?? [],
    Steps: (TASK_STEPS.get(seed.id) ?? []).map((step, index) => ({
      Id: `${seed.id}-s${index + 1}`,
      Title: step.replace(/^x /, ""),
      Done: step.startsWith("x "),
    })),
    Status: seed.done ? GoalTaskStatus.Done : GoalTaskStatus.Todo,
    CompletedAt: seed.done ? today.subtract(7, "day").toISOString() : null,
  }));

  const window = (
    Id: string,
    DayOfWeek: number,
    StartTime: string,
    EndTime: string,
  ): AvailabilityWindow => ({ Id, DayOfWeek, StartTime, EndTime });

  const availability: AvailabilityWindow[] = [
    window("w-1", 1, "20:00", "21:30"),
    window("w-2", 2, "20:00", "21:30"),
    window("w-3", 3, "20:00", "21:30"),
    window("w-4", 4, "20:00", "21:30"),
    window("w-5", 5, "20:00", "20:30"),
    window("w-6", 6, "09:00", "11:00"),
    window("w-7", 6, "14:00", "15:00"),
    window("w-8", 0, "09:00", "10:30"),
  ];

  const entries: ScheduleEntry[] = ENTRIES.map((seed) => ({
    Id: seed.id,
    TaskId: seed.task,
    Date: date(seed.day),
    StartTime: seed.start,
    EndTime: seed.end,
    Status: seed.status,
    PartIndex: seed.part?.[0] ?? 1,
    PartCount: seed.part?.[1] ?? 1,
    RescheduledToId: null,
    CreatedAt: today.subtract(14, "day").toISOString(),
  }));

  const sessions: FocusSession[] = entries
    .filter((entry) => entry.Status === ScheduleEntryStatus.Done)
    .map((entry, index) => {
      const start = dayjs(`${entry.Date}T${entry.StartTime}`);
      const minutes = index % 2 === 0 ? 50 : 75;
      return {
        Id: `s-${index + 1}`,
        TaskId: entry.TaskId,
        EntryId: entry.Id,
        StartedAt: start.toISOString(),
        EndedAt: start.add(minutes, "minute").toISOString(),
        DurationMinutes: minutes,
      };
    });

  const review = (
    weeksAgo: number,
    rate: number,
    mood: ReviewMood,
    adjustment: number,
    notes: string | null,
  ): WeeklyReview => ({
    Id: `r-${weeksAgo}`,
    WeekStart: monday.subtract(weeksAgo * 7, "day").format(DATE_KEY),
    PlannedMinutes: 480,
    ActualMinutes: Math.round((480 * rate) / 100),
    TasksPlanned: 6,
    TasksCompleted: Math.round((6 * rate) / 100),
    CompletionRate: rate,
    ConsistencyDays: Math.round((7 * rate) / 100),
    Mood: mood,
    Notes: notes,
    WorkloadAdjustment: adjustment,
    CreatedAt: monday.subtract(weeksAgo * 7 - 6, "day").toISOString(),
  });

  return {
    goals,
    milestones,
    tasks,
    availability,
    settings: {
      MaxDailyMinutes: 120,
      RestDays: [],
      PreferredTimes: [PreferredTime.Evening],
      SlotMinutes: 15,
      WorkloadPercent: 100,
    },
    entries,
    sessions,
    reviews: [
      review(3, 80, ReviewMood.Normal, 0, "Kana finally feels natural."),
      review(2, 92, ReviewMood.Great, 10, null),
      review(1, 70, ReviewMood.Normal, -10, "Overtime at work on Wednesday."),
    ],
  };
}
