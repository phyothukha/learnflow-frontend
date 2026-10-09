"use client";

import Link from "next/link";
import dayjs from "dayjs";
import { CalendarDays, FileText, Trash2 } from "lucide-react";
import { TeamLogo } from "@/components/team-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FALLBACK_TOPIC_COLOR as FALLBACK_COLOR } from "@/utils/colors";
import type { Topic } from "@/store/server/topics/interface";

interface TopicCardProps {
  topic: Topic;
  logo?: string | null;
  fileCount: number;
  isActive: boolean;
  onOpen: () => void;
  onDelete: () => void;
}

export function TopicCard({
  topic,
  logo,
  fileCount,
  isActive,
  onOpen,
  onDelete,
}: TopicCardProps) {
  const color = topic.Color ?? FALLBACK_COLOR;

  return (
    <Link
      href={`/library/${topic.Id}`}
      onClick={onOpen}
      className={cn(
        "group relative flex flex-col rounded-2xl bg-card p-4 shadow-[0_10px_40px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.04] transition-all",
        "hover:-translate-y-0.5 hover:shadow-[0_14px_44px_rgba(15,23,42,0.1)] dark:ring-white/[0.06]",
        isActive && "ring-2 ring-primary/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <TeamLogo name={topic.Title} color={color} logo={logo} />
          <h2 className="truncate text-[15px] font-semibold tracking-tight">
            {topic.Title}
          </h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
          title="Delete topic"
          aria-label={`Delete ${topic.Title}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {topic.Description?.trim() || "No description yet for this topic."}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-3.5" />
          {dayjs(topic.UpdatedAt).format("MMM D, YYYY")}
        </span>
        <span className="inline-flex items-center gap-1 tabular-nums">
          <FileText className="size-3.5" />
          {fileCount.toLocaleString()} {fileCount === 1 ? "file" : "files"}
        </span>
      </div>
    </Link>
  );
}
