export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: "dashboard_view",

  // Courses
  COURSES_VIEW: "courses_view",
  COURSES_CREATE: "courses_create",
  COURSES_UPDATE: "courses_update",
  COURSES_DELETE: "courses_delete",

  // Lessons
  LESSONS_VIEW: "lessons_view",
  LESSONS_CREATE: "lessons_create",
  LESSONS_UPDATE: "lessons_update",
  LESSONS_DELETE: "lessons_delete",

  // Enrollments
  ENROLLMENTS_VIEW: "enrollments_view",
  ENROLLMENTS_CREATE: "enrollments_create",
  ENROLLMENTS_UPDATE: "enrollments_update",
  ENROLLMENTS_DELETE: "enrollments_delete",

  // Field-level visibility
  ENROLLMENT_INFO_EMAIL_VIEW: "enrollment_info_email_view",
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
