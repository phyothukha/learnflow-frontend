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

  // Topics
  TOPICS_VIEW: "topics_view",
  TOPICS_CREATE: "topics_create",
  TOPICS_UPDATE: "topics_update",
  TOPICS_DELETE: "topics_delete",

  // Documents
  DOCUMENTS_VIEW: "documents_view",
  DOCUMENTS_CREATE: "documents_create",
  DOCUMENTS_UPDATE: "documents_update",
  DOCUMENTS_DELETE: "documents_delete",

  // Notes
  NOTES_VIEW: "notes_view",
  NOTES_CREATE: "notes_create",
  NOTES_UPDATE: "notes_update",
  NOTES_DELETE: "notes_delete",

  // Schedule (study blocks)
  SCHEDULE_VIEW: "schedule_view",
  SCHEDULE_CREATE: "schedule_create",
  SCHEDULE_UPDATE: "schedule_update",
  SCHEDULE_DELETE: "schedule_delete",

  // Analytics
  ANALYTICS_VIEW: "analytics_view",
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
