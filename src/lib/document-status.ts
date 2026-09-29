import type { BadgeVariant } from "@/components/ui/badge";
import { DocumentStatus } from "@/store/server/documents/interface";

export const DOCUMENT_STATUS_LABEL = new Map<DocumentStatus, string>([
  [DocumentStatus.Unread, "Unread"],
  [DocumentStatus.InProgress, "In progress"],
  [DocumentStatus.Completed, "Completed"],
]);

export const DOCUMENT_STATUS_VARIANT = new Map<DocumentStatus, BadgeVariant>([
  [DocumentStatus.Unread, "status-slate"],
  [DocumentStatus.InProgress, "status-amber"],
  [DocumentStatus.Completed, "status-blue"],
]);

export const DOCUMENT_STATUS_SCORE = new Map<DocumentStatus, number>([
  [DocumentStatus.Completed, 5],
  [DocumentStatus.InProgress, 3.5],
  [DocumentStatus.Unread, 2],
]);

export function getDocumentStatusLabel(status: DocumentStatus) {
  return DOCUMENT_STATUS_LABEL.get(status) ?? status;
}
