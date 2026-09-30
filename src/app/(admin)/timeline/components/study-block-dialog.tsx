"use client";

import { useEffect } from "react";
import dayjs from "dayjs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  STUDY_BLOCK_FALLBACK_COLOR,
  STUDY_BLOCK_STATUS,
} from "@/lib/study-block-status";
import {
  useCreateStudyBlock,
  useUpdateStudyBlock,
} from "@/store/server/study-blocks/mutations";
import {
  StudyBlockStatus,
  type StudyBlock,
} from "@/store/server/study-blocks/interface";
import type { Topic } from "@/store/server/topics/interface";

const NO_TOPIC = "none";

const schema = z
  .object({
    Title: z.string().trim().min(1, "Title is required"),
    TopicId: z.string(),
    Status: z.nativeEnum(StudyBlockStatus),
    Date: z.string().min(1, "Date is required"),
    StartTime: z.string().min(1, "Start time is required"),
    EndTime: z.string().min(1, "End time is required"),
    ReminderMinutesBefore: z
      .number({ invalid_type_error: "Enter minutes" })
      .int()
      .min(0, "Must be 0 or more")
      .max(120, "Up to 120 minutes"),
  })
  .refine((values) => values.EndTime > values.StartTime, {
    path: ["EndTime"],
    message: "End time must be after start time",
  });

type FormValues = z.infer<typeof schema>;

export interface StudyBlockDraft {
  StartAt: string;
  EndAt: string;
}

export interface StudyBlockEditorState {
  block: StudyBlock | null;
  draft: StudyBlockDraft | null;
}

function toFormValues({ block, draft }: StudyBlockEditorState): FormValues {
  const startAt = block?.StartAt ?? draft?.StartAt;
  const start = startAt ? dayjs(startAt) : dayjs().hour(9).minute(0);
  const endAt = block?.EndAt ?? draft?.EndAt;
  const end = endAt ? dayjs(endAt) : start.add(1, "hour");

  return {
    Title: block?.Title ?? "",
    TopicId: block?.TopicId ?? NO_TOPIC,
    Status: block?.Status ?? StudyBlockStatus.Upcoming,
    Date: start.format("YYYY-MM-DD"),
    StartTime: start.format("HH:mm"),
    EndTime: end.format("HH:mm"),
    ReminderMinutesBefore: block?.ReminderMinutesBefore ?? 5,
  };
}

export interface StudyBlockDialogProps {
  editor: StudyBlockEditorState | null;
  topics: Topic[];
  onClose: () => void;
}

export function StudyBlockDialog({
  editor,
  topics,
  onClose,
}: StudyBlockDialogProps) {
  const createBlock = useCreateStudyBlock();
  const updateBlock = useUpdateStudyBlock();
  const block = editor?.block ?? null;
  const pending = createBlock.isPending || updateBlock.isPending;
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues({ block: null, draft: null }),
  });

  useEffect(() => {
    if (editor) form.reset(toFormValues(editor));
  }, [editor, form]);

  function onSubmit(values: FormValues) {
    const topicId = values.TopicId === NO_TOPIC ? null : values.TopicId;
    const schedule = {
      Title: values.Title.trim(),
      Status: values.Status,
      StartAt: dayjs(`${values.Date}T${values.StartTime}`).toISOString(),
      EndAt: dayjs(`${values.Date}T${values.EndTime}`).toISOString(),
      ReminderMinutesBefore: values.ReminderMinutesBefore,
    };

    if (block) {
      updateBlock.mutate(
        { id: block.Id, payload: { ...schedule, TopicId: topicId } },
        {
          onSuccess: () => {
            toast.success("Study block updated.");
            onClose();
          },
          onError: () => toast.error("Failed to update block"),
        },
      );
      return;
    }
    createBlock.mutate(
      { ...schedule, TopicId: topicId ?? undefined },
      {
        onSuccess: () => {
          toast.success("Study block scheduled.");
          onClose();
        },
        onError: () => toast.error("Failed to schedule block"),
      },
    );
  }

  return (
    <Dialog
      open={editor !== null}
      onOpenChange={(isOpen) => !isOpen && !pending && onClose()}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {block ? "Edit study block" : "Schedule a study block"}
          </DialogTitle>
          <DialogDescription>
            {block
              ? "Update the block details and schedule."
              : "Plan a focused study session on your timeline."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="Title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. ML Course Ch. 4" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="TopicId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NO_TOPIC}>
                          <span
                            className="size-2 rounded-full"
                            style={{
                              backgroundColor: STUDY_BLOCK_FALLBACK_COLOR,
                            }}
                          />
                          No topic
                        </SelectItem>
                        {topics.map((topic) => (
                          <SelectItem key={topic.Id} value={topic.Id}>
                            <span
                              className="size-2 rounded-full"
                              style={{
                                backgroundColor:
                                  topic.Color ?? STUDY_BLOCK_FALLBACK_COLOR,
                              }}
                            />
                            {topic.Title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="Status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from(STUDY_BLOCK_STATUS, ([value, meta]) => (
                          <SelectItem key={value} value={value}>
                            <span
                              className={`size-2 rounded-full ${meta.dotClass}`}
                            />
                            {meta.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="Date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="StartTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start</FormLabel>
                    <FormControl>
                      <Input type="time" step={900} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="EndTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End</FormLabel>
                    <FormControl>
                      <Input type="time" step={900} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="ReminderMinutesBefore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remind me (minutes before)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={120}
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={Number.isNaN(field.value) ? "" : field.value}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {block ? "Save changes" : "Schedule"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
