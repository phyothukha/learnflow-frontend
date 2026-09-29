import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { FALLBACK_TOPIC_COLOR } from "@/lib/utils";
import type { Topic } from "@/store/server/topics/interface";

interface TopicHeaderProps {
  topic?: Topic;
  children?: ReactNode;
}

export function TopicHeader({ topic, children }: TopicHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-5">
      <div className="min-w-0 space-y-1.5">
        <div className="flex items-center gap-2.5">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: topic?.Color ?? FALLBACK_TOPIC_COLOR }}
          />
          {topic ? (
            <h1 className="truncate text-xl font-semibold tracking-tight">
              {topic.Title}
            </h1>
          ) : (
            <Skeleton className="h-8 w-48" />
          )}
        </div>
        <p className="truncate text-sm text-muted-foreground">
          {topic?.Description || "Folders and documents in this topic"}
        </p>
      </div>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}
