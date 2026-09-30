"use client";

import { useState, type ReactNode } from "react";
import dayjs from "dayjs";
import {
  Bell,
  CalendarDays,
  Check,
  Pencil,
  Repeat,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { STUDY_BLOCK_STATUS } from "@/lib/study-block-status";
import { useUpdateStudyBlock } from "@/store/server/study-blocks/mutations";
import {
  StudyBlockStatus,
  type StudyBlock,
} from "@/store/server/study-blocks/interface";
import { formatTimeRange } from "@/utils/format";

export function isOverdue(block: StudyBlock) {
  return (
    block.Status === StudyBlockStatus.Upcoming &&
    dayjs(block.EndAt).isBefore(dayjs())
  );
}

export interface StudyBlockPopoverProps {
  block: StudyBlock;
  color: string;
  topicTitle: string | null;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  onEdit: (block: StudyBlock) => void;
  onDelete: (block: StudyBlock) => void;
}

export function StudyBlockPopover({
  block,
  color,
  topicTitle,
  children,
  side = "right",
  onEdit,
  onDelete,
}: StudyBlockPopoverProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const updateBlock = useUpdateStudyBlock();
  const status = STUDY_BLOCK_STATUS.get(block.Status);

  const changeStatus = (next: StudyBlockStatus) =>
    updateBlock.mutate(
      { id: block.Id, payload: { Status: next } },
      {
        onSuccess: () =>
          toast.success(
            `Marked as ${STUDY_BLOCK_STATUS.get(next)?.label ?? next}.`,
          ),
        onError: () => toast.error("Failed to update block"),
      },
    );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side={isMobile ? "bottom" : side}
        align={isMobile ? "center" : "start"}
        className="w-80 p-0"
      >
        <div className="space-y-4 p-4">
          <div className="flex items-start gap-3">
            <span
              className="mt-1 h-10 w-1 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
            />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="leading-snug font-semibold">{block.Title}</p>
              <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {topicTitle ?? "No topic"}
              </p>
            </div>
            <Badge variant={isOverdue(block) ? "status-red" : status?.variant}>
              {isOverdue(block) ? "Overdue" : (status?.label ?? block.Status)}
            </Badge>
          </div>

          <Separator />

          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <CalendarDays className="size-4 shrink-0" />
              {dayjs(block.StartAt).format("ddd, DD MMM YYYY")} ·{" "}
              {formatTimeRange(block.StartAt, block.EndAt)}
            </p>
            <p className="flex items-center gap-2">
              <Bell className="size-4 shrink-0" />
              {block.ReminderMinutesBefore > 0
                ? `Reminder ${block.ReminderMinutesBefore} min before`
                : "No reminder"}
            </p>
            {block.RecurrenceRule && (
              <p className="flex items-center gap-2">
                <Repeat className="size-4 shrink-0" />
                <span className="truncate">{block.RecurrenceRule}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={block.Status}
              onValueChange={(value) => changeStatus(value as StudyBlockStatus)}
            >
              <SelectTrigger size="sm" className="flex-1" aria-label="Status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from(STUDY_BLOCK_STATUS, ([value, meta]) => (
                  <SelectItem key={value} value={value}>
                    <span className={`size-2 rounded-full ${meta.dotClass}`} />
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {block.Status !== StudyBlockStatus.Done && (
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                aria-label="Mark done"
                title="Mark done"
                onClick={() => changeStatus(StudyBlockStatus.Done)}
              >
                <Check className="size-3.5" />
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              aria-label="Edit block"
              onClick={() => {
                setOpen(false);
                onEdit(block);
              }}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8 text-destructive hover:text-destructive"
              aria-label="Delete block"
              onClick={() => {
                setOpen(false);
                onDelete(block);
              }}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
