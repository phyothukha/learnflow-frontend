import type { BadgeVariant } from "@/components/ui/badge";
import { StudyBlockStatus } from "@/store/server/study-blocks/interface";

export interface StudyBlockStatusMeta {
  label: string;
  variant: BadgeVariant;
  dotClass: string;
}

export const STUDY_BLOCK_STATUS = new Map<
  StudyBlockStatus,
  StudyBlockStatusMeta
>([
  [
    StudyBlockStatus.Upcoming,
    { label: "Upcoming", variant: "status-slate", dotClass: "bg-slate-400" },
  ],
  [
    StudyBlockStatus.Active,
    { label: "Active", variant: "status-green", dotClass: "bg-emerald-500" },
  ],
  [
    StudyBlockStatus.Done,
    { label: "Done", variant: "status-blue", dotClass: "bg-sky-500" },
  ],
  [
    StudyBlockStatus.Missed,
    { label: "Missed", variant: "status-red", dotClass: "bg-red-500" },
  ],
]);

export const STUDY_BLOCK_FALLBACK_COLOR = "#8b8b8b";
