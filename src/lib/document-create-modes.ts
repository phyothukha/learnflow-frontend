import { Link2, PenLine, Upload, type LucideIcon } from "lucide-react";

export enum CreateDocumentMode {
  Write = "write",
  Upload = "upload",
  Link = "link",
}

export interface CreateModeMeta {
  label: string;
  description: string;
  submitLabel: string;
  icon: LucideIcon;
}

export const CREATE_DOCUMENT_MODES = new Map<
  CreateDocumentMode,
  CreateModeMeta
>([
  [
    CreateDocumentMode.Write,
    {
      label: "Write",
      description: "New Markdown page",
      submitLabel: "Create & start writing",
      icon: PenLine,
    },
  ],
  [
    CreateDocumentMode.Upload,
    {
      label: "Upload",
      description: "PDF, Word, PPT, CSV, MD",
      submitLabel: "Upload",
      icon: Upload,
    },
  ],
  [
    CreateDocumentMode.Link,
    {
      label: "Link",
      description: "External URL",
      submitLabel: "Save link",
      icon: Link2,
    },
  ],
]);
