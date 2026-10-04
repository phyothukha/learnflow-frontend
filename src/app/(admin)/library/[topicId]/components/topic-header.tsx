"use client";

import type { ReactNode } from "react";
import { TeamLogo } from "@/components/team-logo";
import { Skeleton } from "@/components/ui/skeleton";
import { useTopicMetaStore } from "@/store/client/topic-meta-store";
import { FALLBACK_TOPIC_COLOR } from "@/utils/colors";
import type { Topic } from "@/store/server/topics/interface";

interface TopicHeaderProps {
  topic?: Topic;
  children?: ReactNode;
}

export function TopicHeader({ topic, children }: TopicHeaderProps) {
  const logo = useTopicMetaStore((state) =>
    topic ? (state.logos[topic.Id] ?? null) : null,
  );
  const color = topic?.Color ?? FALLBACK_TOPIC_COLOR;

  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-5">
      <div className="min-w-0 space-y-1.5">
        <div className="flex items-center gap-2.5">
          {topic ? (
            <TeamLogo name={topic.Title} color={color} logo={logo} />
          ) : (
            <Skeleton className="size-8 rounded-lg" />
          )}
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
