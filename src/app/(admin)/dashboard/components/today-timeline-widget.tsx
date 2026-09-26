"use client";

import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { StudyBlock } from "@/store/server/study-blocks/interface";
import { FALLBACK_TOPIC_COLOR } from "@/lib/topic-colors";
import { cn } from "@/lib/utils";
import { WidgetHeader } from "./widget-header";

export function TodayTimelineWidget({
  blocks,
  className,
}: {
  blocks: StudyBlock[];
  className?: string;
}) {
  const router = useRouter();
  return (
    <Card className={cn("shadow-sm", className)}>
      <WidgetHeader
        title={`Today · ${dayjs().format("dddd, MMM D")}`}
        href="/timeline"
        linkLabel="Open timeline"
      />
      <CardContent>
        {blocks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <CalendarClock className="size-6" />
            <p className="text-sm">Nothing planned today.</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push("/timeline")}
            >
              Plan your day
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {blocks.slice(0, 6).map((block) => {
              const isActive =
                dayjs().isAfter(block.StartAt) && dayjs().isBefore(block.EndAt);
              return (
                <div
                  key={block.Id}
                  className={cn(
                    "flex items-center gap-3 rounded-md border px-3 py-2",
                    isActive && "border-primary",
                    block.Status === "Done" && "opacity-60",
                  )}
                >
                  <span
                    className="h-8 w-1 rounded-full"
                    style={{
                      backgroundColor:
                        block.Topic?.Color ?? FALLBACK_TOPIC_COLOR,
                    }}
                  />
                  <span className="w-24 shrink-0 text-xs tabular-nums text-muted-foreground">
                    {dayjs(block.StartAt).format("HH:mm")} –{" "}
                    {dayjs(block.EndAt).format("HH:mm")}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {block.Title}
                  </span>
                  <Badge
                    variant={block.Status === "Done" ? "outline" : "secondary"}
                    className="text-xs"
                  >
                    {isActive && block.Status !== "Done" ? "Now" : block.Status}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
