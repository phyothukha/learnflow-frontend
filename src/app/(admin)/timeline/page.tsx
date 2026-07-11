"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";
import {
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useFetchStudyBlocks } from "@/store/server/study-blocks/queries";
import {
  useCreateStudyBlock,
  useDeleteStudyBlock,
  useUpdateStudyBlock,
} from "@/store/server/study-blocks/mutations";
import type { StudyBlock } from "@/store/server/study-blocks/interface";
import { useFetchTopics } from "@/store/server/topics/queries";

const FALLBACK_COLOR = "#8b8b8b";

const statusVariant: Record<
  StudyBlock["Status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  Upcoming: "secondary",
  Active: "default",
  Done: "outline",
  Missed: "destructive",
};

export default function TimelinePage() {
  const router = useRouter();
  const { status } = useSession();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.SCHEDULE_VIEW);

  const [dayOffset, setDayOffset] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);

  const day = dayjs().startOf("day").add(dayOffset, "day");
  const { data, isLoading } = useFetchStudyBlocks({
    from: day.toISOString(),
    to: day.add(1, "day").toISOString(),
    limit: 100,
  });
  const { data: topicsData } = useFetchTopics({
    limit: 100,
    orderby: "Title asc",
  });
  const updateBlock = useUpdateStudyBlock();
  const deleteBlock = useDeleteStudyBlock();

  useEffect(() => {
    if (status === "authenticated" && !canView) router.replace("/forbidden");
  }, [status, canView, router]);

  if (status !== "authenticated" || !canView) return null;

  const blocks = data?.value ?? [];
  const topics = topicsData?.value ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Timeline</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" />
              Add block
            </Button>
          </DialogTrigger>
          <CreateBlockDialog
            day={day.format("YYYY-MM-DD")}
            topics={topics}
            onClose={() => setCreateOpen(false)}
          />
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => setDayOffset((o) => o - 1)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => setDayOffset((o) => o + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>
        <span className="text-sm font-medium">
          {day.format("dddd, MMM D YYYY")}
        </span>
        {dayOffset !== 0 && (
          <Button variant="ghost" size="sm" onClick={() => setDayOffset(0)}>
            Today
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : blocks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <CalendarClock className="size-8" />
            <p>Nothing planned for this day.</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCreateOpen(true)}
            >
              Plan your day
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {blocks.map((block) => {
            const color = block.Topic?.Color ?? FALLBACK_COLOR;
            const isPast = dayjs(block.EndAt).isBefore(dayjs());
            return (
              <Card
                key={block.Id}
                className={cn(
                  "shadow-sm",
                  block.Status === "Done" && "opacity-60",
                )}
              >
                <CardContent className="flex items-center gap-4 py-4">
                  <div
                    className="h-12 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <div className="w-28 shrink-0 text-sm tabular-nums text-muted-foreground">
                    {dayjs(block.StartAt).format("HH:mm")} –{" "}
                    {dayjs(block.EndAt).format("HH:mm")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{block.Title}</p>
                    {block.Topic && (
                      <p className="truncate text-xs text-muted-foreground">
                        {block.Topic.Title}
                      </p>
                    )}
                  </div>
                  <Badge variant={statusVariant[block.Status]}>
                    {block.Status === "Upcoming" && isPast
                      ? "Overdue"
                      : block.Status}
                  </Badge>
                  {block.Status !== "Done" && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={updateBlock.isPending}
                      onClick={() =>
                        updateBlock.mutate(
                          { id: block.Id, payload: { Status: "Done" } },
                          { onSuccess: () => toast.success("Block completed") },
                        )
                      }
                    >
                      <Check className="size-4" />
                      Done
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground"
                    disabled={deleteBlock.isPending}
                    onClick={() =>
                      deleteBlock.mutate(block.Id, {
                        onSuccess: () => toast.success("Block deleted"),
                      })
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CreateBlockDialog({
  day,
  topics,
  onClose,
}: {
  day: string;
  topics: { Id: string; Title: string }[];
  onClose: () => void;
}) {
  const createBlock = useCreateStudyBlock();
  const [title, setTitle] = useState("");
  const [topicId, setTopicId] = useState<string>("none");
  const [date, setDate] = useState(day);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [reminder, setReminder] = useState(5);

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    const startAt = dayjs(`${date}T${startTime}`);
    const endAt = dayjs(`${date}T${endTime}`);
    if (!endAt.isAfter(startAt)) {
      toast.error("End time must be after start time");
      return;
    }
    createBlock.mutate(
      {
        Title: title.trim(),
        TopicId: topicId === "none" ? undefined : topicId,
        StartAt: startAt.toISOString(),
        EndAt: endAt.toISOString(),
        ReminderMinutesBefore: reminder,
      },
      {
        onSuccess: () => {
          toast.success("Study block scheduled");
          onClose();
        },
        onError: () => toast.error("Failed to schedule block"),
      },
    );
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Schedule a study block</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="block-title">Title</Label>
          <Input
            id="block-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. ML Course Ch. 4"
          />
        </div>
        <div className="space-y-2">
          <Label>Topic</Label>
          <Select value={topicId} onValueChange={setTopicId}>
            <SelectTrigger>
              <SelectValue placeholder="Select topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No topic</SelectItem>
              {topics.map((t) => (
                <SelectItem key={t.Id} value={t.Id}>
                  {t.Title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="block-date">Date</Label>
            <Input
              id="block-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="block-start">Start</Label>
            <Input
              id="block-start"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="block-end">End</Label>
            <Input
              id="block-end"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="block-reminder">Remind me (minutes before)</Label>
          <Input
            id="block-reminder"
            type="number"
            min={0}
            max={120}
            value={reminder}
            onChange={(e) => setReminder(Number(e.target.value))}
          />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleSubmit} disabled={createBlock.isPending}>
          Schedule
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
