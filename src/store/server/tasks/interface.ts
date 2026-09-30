export enum TaskStatus {
  Todo = "Todo",
  InProgress = "InProgress",
  Review = "Review",
  Done = "Done",
}

export enum TaskPriority {
  Low = "Low",
  Medium = "Medium",
  High = "High",
  Urgent = "Urgent",
}

export enum TaskCategory {
  Study = "Study",
  Assignment = "Assignment",
  Meeting = "Meeting",
  Personal = "Personal",
  Work = "Work",
}

export interface TaskAssignee {
  Name: string;
  Email: string;
  Phone: string | null;
}

export interface Task {
  Id: string;
  Title: string;
  Description: string | null;
  Status: TaskStatus;
  Priority: TaskPriority;
  Category: TaskCategory;
  Assignee: TaskAssignee;
  StartAt: string;
  EndAt: string;
  Location: string | null;
  Tags: string[];
}
