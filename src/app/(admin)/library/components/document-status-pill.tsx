import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { DocumentStatus } from "@/store/server/documents/interface";

export const DOCUMENT_STATUS_LABEL: Record<DocumentStatus, string> = {
  [DocumentStatus.Unread]: "Unread",
  [DocumentStatus.InProgress]: "In progress",
  [DocumentStatus.Completed]: "Completed",
};

export const DOCUMENT_STATUS_VARIANT: Record<DocumentStatus, BadgeVariant> = {
  [DocumentStatus.Unread]: "status-slate",
  [DocumentStatus.InProgress]: "status-amber",
  [DocumentStatus.Completed]: "status-blue",
};

export interface DocumentStatusPillProps {
  status: DocumentStatus;
  className?: string;
}

export function DocumentStatusPill({
  status,
  className,
}: DocumentStatusPillProps) {
  return (
    <Badge variant={DOCUMENT_STATUS_VARIANT[status]} className={className}>
      {DOCUMENT_STATUS_LABEL[status]}
    </Badge>
  );
}
