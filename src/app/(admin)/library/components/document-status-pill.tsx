import { Badge } from "@/components/ui/badge";
import {
  DOCUMENT_STATUS_VARIANT,
  getDocumentStatusLabel,
} from "@/lib/document-status";
import type { DocumentStatus } from "@/store/server/documents/interface";

export interface DocumentStatusPillProps {
  status: DocumentStatus;
  className?: string;
}

export function DocumentStatusPill({
  status,
  className,
}: DocumentStatusPillProps) {
  return (
    <Badge
      variant={DOCUMENT_STATUS_VARIANT.get(status) ?? "status-slate"}
      className={className}
    >
      {getDocumentStatusLabel(status)}
    </Badge>
  );
}
