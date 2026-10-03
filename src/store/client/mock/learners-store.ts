import { create } from "zustand";
import type { PermissionCode } from "@/lib/permissions";
import { EnrollmentStatus } from "@/store/server/enrollments/interface";
import { LEARNER_ROLE_ID } from "./roles-store";

export enum LearnerStatus {
  Invited = "Invited",
  Active = "Active",
  Disabled = "Disabled",
}

export interface MockCourse {
  Id: string;
  Title: string;
}

export interface LearnerEnrollment {
  Id: string;
  CourseId: string;
  CourseTitle: string;
  Status: EnrollmentStatus;
  ProgressPercent: number;
  EnrolledAt: string;
}

export interface Learner {
  Id: string;
  Name: string;
  Email: string;
  RoleId: string;
  /** null = follows the role; otherwise this learner has their own list. */
  CustomPermissions: PermissionCode[] | null;
  Status: LearnerStatus;
  JoinedAt: string;
  LastLoginAt: string | null;
  ActiveGoals: number;
  TasksDone: number;
  TasksTotal: number;
  StreakDays: number;
  Enrollments: LearnerEnrollment[];
}

export const MOCK_COURSES: MockCourse[] = [
  { Id: "course-n5", Title: "Japanese N5 Foundation" },
  { Id: "course-n2", Title: "JLPT N2 Preparation" },
  { Id: "course-fe", Title: "ITPEC FE Exam Prep" },
  { Id: "course-react", Title: "React Fundamentals" },
  { Id: "course-eng", Title: "English for IT" },
];

function courseTitle(courseId: string) {
  return MOCK_COURSES.find((course) => course.Id === courseId)?.Title ?? "—";
}

function enrollment(
  id: string,
  courseId: string,
  status: EnrollmentStatus,
  progress: number,
  enrolledAt: string,
): LearnerEnrollment {
  return {
    Id: id,
    CourseId: courseId,
    CourseTitle: courseTitle(courseId),
    Status: status,
    ProgressPercent: progress,
    EnrolledAt: enrolledAt,
  };
}

function learner(
  id: string,
  name: string,
  status: LearnerStatus,
  joinedAt: string,
  lastLoginAt: string | null,
  stats: [goals: number, done: number, total: number, streak: number],
  enrollments: LearnerEnrollment[] = [],
  roleId = LEARNER_ROLE_ID,
): Learner {
  return {
    Id: id,
    Name: name,
    Email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
    RoleId: roleId,
    CustomPermissions: null,
    Status: status,
    JoinedAt: joinedAt,
    LastLoginAt: lastLoginAt,
    ActiveGoals: stats[0],
    TasksDone: stats[1],
    TasksTotal: stats[2],
    StreakDays: stats[3],
    Enrollments: enrollments,
  };
}

const E = EnrollmentStatus;
const S = LearnerStatus;

const SEED_LEARNERS: Learner[] = [
  learner(
    "l-01",
    "Aye Chan",
    S.Active,
    "2026-05-04T08:00:00Z",
    "2026-09-30T19:20:00Z",
    [2, 64, 88, 12],
    [
      enrollment("e-01", "course-n2", E.Active, 62, "2026-05-06T08:00:00Z"),
      enrollment("e-02", "course-fe", E.Active, 35, "2026-06-10T08:00:00Z"),
    ],
  ),
  learner(
    "l-02",
    "Min Thu",
    S.Active,
    "2026-05-12T08:00:00Z",
    "2026-09-30T21:05:00Z",
    [1, 41, 50, 21],
    [enrollment("e-03", "course-fe", E.Active, 78, "2026-05-14T08:00:00Z")],
  ),
  learner(
    "l-03",
    "Su Myat",
    S.Active,
    "2026-06-01T08:00:00Z",
    "2026-09-29T17:40:00Z",
    [3, 27, 60, 4],
    [
      enrollment("e-04", "course-n5", E.Completed, 100, "2026-06-02T08:00:00Z"),
      enrollment("e-05", "course-n2", E.Active, 18, "2026-08-01T08:00:00Z"),
    ],
  ),
  learner(
    "l-04",
    "Htet Aung",
    S.Active,
    "2026-06-15T08:00:00Z",
    "2026-09-27T10:15:00Z",
    [1, 12, 40, 0],
    [enrollment("e-06", "course-react", E.Active, 40, "2026-06-16T08:00:00Z")],
  ),
  learner(
    "l-05",
    "Nandar Win",
    S.Active,
    "2026-06-20T08:00:00Z",
    "2026-09-30T08:30:00Z",
    [2, 55, 70, 9],
    [enrollment("e-07", "course-eng", E.Active, 55, "2026-06-21T08:00:00Z")],
  ),
  learner(
    "l-06",
    "Zaw Lin",
    S.Invited,
    "2026-09-28T08:00:00Z",
    null,
    [0, 0, 0, 0],
  ),
  learner(
    "l-07",
    "Phyo Wai",
    S.Active,
    "2026-07-03T08:00:00Z",
    "2026-09-26T20:00:00Z",
    [1, 18, 30, 2],
    [enrollment("e-08", "course-n5", E.Active, 90, "2026-07-04T08:00:00Z")],
  ),
  learner(
    "l-08",
    "Hnin Si",
    S.Disabled,
    "2026-04-18T08:00:00Z",
    "2026-08-02T12:00:00Z",
    [0, 9, 35, 0],
    [
      enrollment(
        "e-09",
        "course-react",
        E.Cancelled,
        22,
        "2026-04-20T08:00:00Z",
      ),
    ],
  ),
  learner(
    "l-09",
    "Thiha Soe",
    S.Active,
    "2026-07-21T08:00:00Z",
    "2026-09-30T06:45:00Z",
    [2, 33, 45, 15],
    [
      enrollment("e-10", "course-fe", E.Active, 51, "2026-07-22T08:00:00Z"),
      enrollment("e-11", "course-eng", E.Pending, 0, "2026-09-20T08:00:00Z"),
    ],
  ),
  learner(
    "l-10",
    "Ei Mon",
    S.Invited,
    "2026-09-29T08:00:00Z",
    null,
    [0, 0, 0, 0],
  ),
  learner(
    "l-11",
    "Kaung Myat",
    S.Active,
    "2026-08-09T08:00:00Z",
    "2026-09-25T15:30:00Z",
    [1, 7, 24, 1],
    [enrollment("e-12", "course-n2", E.Active, 12, "2026-08-10T08:00:00Z")],
  ),
  learner(
    "l-12",
    "Yadanar Oo",
    S.Active,
    "2026-08-30T08:00:00Z",
    "2026-09-30T18:10:00Z",
    [2, 20, 26, 7],
    [enrollment("e-13", "course-n5", E.Active, 70, "2026-08-31T08:00:00Z")],
  ),
];

export interface InviteLearnerInput {
  Email: string;
  RoleId: string;
  CustomPermissions: PermissionCode[] | null;
  /** Optional — invite is email-only; name is filled when they accept. */
  Name?: string;
}

export interface UpdateLearnerInput {
  Name?: string;
  Email?: string;
  RoleId?: string;
  CustomPermissions?: PermissionCode[] | null;
}

function displayNameFromEmail(email: string) {
  const local = email.split("@")[0]?.trim() || "Learner";
  return local
    .replace(/[._+-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

interface LearnersState {
  learners: Learner[];
  inviteLearner: (input: InviteLearnerInput) => Learner;
  updateLearner: (id: string, patch: UpdateLearnerInput) => void;
  setStatus: (id: string, status: LearnerStatus) => void;
  deleteLearner: (id: string) => void;
  enroll: (learnerId: string, courseId: string) => void;
  unenroll: (learnerId: string, enrollmentId: string) => void;
}

function patchLearner(
  learners: Learner[],
  id: string,
  update: (learner: Learner) => Learner,
) {
  return learners.map((item) => (item.Id === id ? update(item) : item));
}

export const useLearnersStore = create<LearnersState>()((set) => ({
  learners: SEED_LEARNERS,
  inviteLearner: ({ Name, Email, RoleId, CustomPermissions }) => {
    const created: Learner = {
      Id: crypto.randomUUID(),
      Name: Name?.trim() || displayNameFromEmail(Email),
      Email: Email.trim(),
      RoleId,
      CustomPermissions,
      Status: LearnerStatus.Invited,
      JoinedAt: new Date().toISOString(),
      LastLoginAt: null,
      ActiveGoals: 0,
      TasksDone: 0,
      TasksTotal: 0,
      StreakDays: 0,
      Enrollments: [],
    };
    set((state) => ({ learners: [created, ...state.learners] }));
    return created;
  },
  updateLearner: (id, patch) =>
    set((state) => ({
      learners: patchLearner(state.learners, id, (item) => ({
        ...item,
        ...patch,
      })),
    })),
  setStatus: (id, status) =>
    set((state) => ({
      learners: patchLearner(state.learners, id, (item) => ({
        ...item,
        Status: status,
      })),
    })),
  deleteLearner: (id) =>
    set((state) => ({
      learners: state.learners.filter((item) => item.Id !== id),
    })),
  enroll: (learnerId, courseId) =>
    set((state) => ({
      learners: patchLearner(state.learners, learnerId, (item) => {
        if (item.Enrollments.some((e) => e.CourseId === courseId)) return item;
        return {
          ...item,
          Enrollments: [
            ...item.Enrollments,
            enrollment(
              crypto.randomUUID(),
              courseId,
              EnrollmentStatus.Active,
              0,
              new Date().toISOString(),
            ),
          ],
        };
      }),
    })),
  unenroll: (learnerId, enrollmentId) =>
    set((state) => ({
      learners: patchLearner(state.learners, learnerId, (item) => ({
        ...item,
        Enrollments: item.Enrollments.filter((e) => e.Id !== enrollmentId),
      })),
    })),
}));
