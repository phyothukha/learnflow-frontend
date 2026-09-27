import type { StudyDocument } from "@/store/server/documents/interface";

export interface DocumentsColumnsProps {
  topicId: string;
  onSettings: (document: StudyDocument) => void;
}

export interface DocumentsTableProps {
  documents: StudyDocument[];
  topicId: string;
  onSettings: (document: StudyDocument) => void;
}
