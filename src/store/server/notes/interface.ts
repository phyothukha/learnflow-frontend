/** Topic-scoped API note (legacy backend shape). */
export interface Note {
  Id: string;
  TopicId: string;
  DocumentId: string | null;
  Title: string;
  Content: string | null;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface NoteListParams {
  page?: number;
  limit?: number;
  topicId?: string;
  documentId?: string;
}

export interface CreateNotePayload {
  TopicId: string;
  DocumentId?: string;
  Title: string;
  Content?: string;
}

export type UpdateNotePayload = Partial<Omit<CreateNotePayload, "TopicId">>;

/** Notes live under Private or a Team — not under topics. */
export enum NoteVisibility {
  Private = "Private",
  Team = "Team",
}

/** Markdown note used by the Teams / Notes UI (local until API catches up). */
export interface WorkspaceNote {
  Id: string;
  Title: string;
  Content: string | null;
  Visibility: NoteVisibility;
  /** Set when Visibility is Team. */
  TeamId: string | null;
  OwnerId: string;
  OwnerName: string;
  CreatedAt: string;
  UpdatedAt: string;
}

export type WorkspaceNoteInput = Omit<
  WorkspaceNote,
  "Id" | "CreatedAt" | "UpdatedAt"
>;
