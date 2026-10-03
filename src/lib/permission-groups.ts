import { PERMISSIONS, type PermissionCode } from "@/lib/permissions";

export interface PermissionGroupItem {
  code: PermissionCode;
  label: string;
}

export interface PermissionGroup {
  key: string;
  label: string;
  description: string;
  items: PermissionGroupItem[];
}

function crud(
  view: PermissionCode,
  create: PermissionCode,
  update: PermissionCode,
  remove: PermissionCode,
): PermissionGroupItem[] {
  return [
    { code: view, label: "View" },
    { code: create, label: "Create" },
    { code: update, label: "Update" },
    { code: remove, label: "Delete" },
  ];
}

/** Tabs a learner can see in the learner portal (managed per learner or via role). */
export const LEARNER_PORTAL_PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    description: "Home overview tab",
    items: [{ code: PERMISSIONS.DASHBOARD_VIEW, label: "Access" }],
  },
  {
    key: "schedule",
    label: "Tasks",
    description: "Tasks and study schedule tab",
    items: crud(
      PERMISSIONS.SCHEDULE_VIEW,
      PERMISSIONS.SCHEDULE_CREATE,
      PERMISSIONS.SCHEDULE_UPDATE,
      PERMISSIONS.SCHEDULE_DELETE,
    ),
  },
  {
    key: "notes",
    label: "Notes",
    description: "Private and team markdown notes tab",
    items: crud(
      PERMISSIONS.NOTES_VIEW,
      PERMISSIONS.NOTES_CREATE,
      PERMISSIONS.NOTES_UPDATE,
      PERMISSIONS.NOTES_DELETE,
    ),
  },
  {
    key: "teams",
    label: "Teams",
    description: "Study teams tab",
    items: crud(
      PERMISSIONS.TEAMS_VIEW,
      PERMISSIONS.TEAMS_CREATE,
      PERMISSIONS.TEAMS_UPDATE,
      PERMISSIONS.TEAMS_DELETE,
    ),
  },
];

export const LEARNER_PORTAL_VIEW_CODES = [
  PERMISSIONS.DASHBOARD_VIEW,
  PERMISSIONS.SCHEDULE_VIEW,
  PERMISSIONS.NOTES_VIEW,
  PERMISSIONS.TEAMS_VIEW,
] as const;

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    description: "Overview and study analytics",
    items: [
      { code: PERMISSIONS.DASHBOARD_VIEW, label: "View dashboard" },
      { code: PERMISSIONS.ANALYTICS_VIEW, label: "View analytics" },
    ],
  },
  {
    key: "learners",
    label: "Learners",
    description: "Invite and manage learner accounts",
    items: crud(
      PERMISSIONS.LEARNERS_VIEW,
      PERMISSIONS.LEARNERS_CREATE,
      PERMISSIONS.LEARNERS_UPDATE,
      PERMISSIONS.LEARNERS_DELETE,
    ),
  },
  {
    key: "courses",
    label: "Courses",
    description: "Course catalogue",
    items: crud(
      PERMISSIONS.COURSES_VIEW,
      PERMISSIONS.COURSES_CREATE,
      PERMISSIONS.COURSES_UPDATE,
      PERMISSIONS.COURSES_DELETE,
    ),
  },
  {
    key: "lessons",
    label: "Lessons",
    description: "Lessons inside a course",
    items: crud(
      PERMISSIONS.LESSONS_VIEW,
      PERMISSIONS.LESSONS_CREATE,
      PERMISSIONS.LESSONS_UPDATE,
      PERMISSIONS.LESSONS_DELETE,
    ),
  },
  {
    key: "enrollments",
    label: "Enrollments",
    description: "Enroll learners into courses",
    items: [
      ...crud(
        PERMISSIONS.ENROLLMENTS_VIEW,
        PERMISSIONS.ENROLLMENTS_CREATE,
        PERMISSIONS.ENROLLMENTS_UPDATE,
        PERMISSIONS.ENROLLMENTS_DELETE,
      ),
      {
        code: PERMISSIONS.ENROLLMENT_INFO_EMAIL_VIEW,
        label: "See learner email",
      },
    ],
  },
  {
    key: "topics",
    label: "Topics",
    description: "Subjects used to label notes and tasks",
    items: crud(
      PERMISSIONS.TOPICS_VIEW,
      PERMISSIONS.TOPICS_CREATE,
      PERMISSIONS.TOPICS_UPDATE,
      PERMISSIONS.TOPICS_DELETE,
    ),
  },
  {
    key: "documents",
    label: "Library documents",
    description: "Uploaded documents stored in the library",
    items: crud(
      PERMISSIONS.DOCUMENTS_VIEW,
      PERMISSIONS.DOCUMENTS_CREATE,
      PERMISSIONS.DOCUMENTS_UPDATE,
      PERMISSIONS.DOCUMENTS_DELETE,
    ),
  },
  {
    key: "notes",
    label: "Notes",
    description: "Private markdown notes or notes shared inside a team",
    items: crud(
      PERMISSIONS.NOTES_VIEW,
      PERMISSIONS.NOTES_CREATE,
      PERMISSIONS.NOTES_UPDATE,
      PERMISSIONS.NOTES_DELETE,
    ),
  },
  {
    key: "teams",
    label: "Teams",
    description: "Study teams members can join; team notes are shared here",
    items: crud(
      PERMISSIONS.TEAMS_VIEW,
      PERMISSIONS.TEAMS_CREATE,
      PERMISSIONS.TEAMS_UPDATE,
      PERMISSIONS.TEAMS_DELETE,
    ),
  },
  {
    key: "schedule",
    label: "Schedule",
    description: "Tasks and study blocks",
    items: crud(
      PERMISSIONS.SCHEDULE_VIEW,
      PERMISSIONS.SCHEDULE_CREATE,
      PERMISSIONS.SCHEDULE_UPDATE,
      PERMISSIONS.SCHEDULE_DELETE,
    ),
  },
  {
    key: "roles",
    label: "Roles & permissions",
    description: "Who can do what in the portal",
    items: crud(
      PERMISSIONS.ROLES_VIEW,
      PERMISSIONS.ROLES_CREATE,
      PERMISSIONS.ROLES_UPDATE,
      PERMISSIONS.ROLES_DELETE,
    ),
  },
];

export const ALL_PERMISSION_CODES = Object.values(PERMISSIONS);
