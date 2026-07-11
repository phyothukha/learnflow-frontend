"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle,
  FileText,
  Flame,
  NotebookPen,
  Target,
  Timer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkspaceStore } from "@/store/client/workspace";
import { useFetchTopics } from "@/store/server/topics/queries";
import { useFetchDocuments } from "@/store/server/documents/queries";
import { useFetchNotes } from "@/store/server/notes/queries";
import { useFetchStudyBlocks } from "@/store/server/study-blocks/queries";
import type { StudyBlock } from "@/store/server/study-blocks/interface";
import { FALLBACK_TOPIC_COLOR, TOPIC_COLORS } from "@/lib/topic-colors";
import { cn } from "@/lib/utils";

const WEEK_CHART_HUE = TOPIC_COLORS[0];

function blockMinutes(block: StudyBlock) {
  return Math.max(0, dayjs(block.EndAt).diff(dayjs(block.StartAt), "minute"));
}

export default function DashboardPage() {
  const activeTopicId = useWorkspaceStore((s) => s.activeTopicId);

  const todayStart = dayjs().startOf("day");
  const weekStart = dayjs().startOf("week");

  const { data: todayBlocks } = useFetchStudyBlocks({
    from: todayStart.toISOString(),
    to: todayStart.add(1, "day").toISOString(),
    limit: 100,
  });
  const { data: weekBlocks } = useFetchStudyBlocks({
    from: weekStart.toISOString(),
    to: weekStart.add(7, "day").toISOString(),
    limit: 100,
  });
  const { data: topicsData } = useFetchTopics({ limit: 100 });
  const { data: documentsData } = useFetchDocuments({ limit: 100 });
  const { data: notesData } = useFetchNotes({
    limit: 3,
    topicId: activeTopicId ?? undefined,
    orderby: "UpdatedAt desc",
  });
  const { data: contextDocuments } = useFetchDocuments({
    limit: 5,
    topicId: activeTopicId ?? undefined,
    orderby: "UpdatedAt desc",
  });

  const topics = topicsData?.value ?? [];
  const activeTopic = topics.find((t) => t.Id === activeTopicId) ?? null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 lg:grid-cols-12">
        <TodayTimelineWidget
          blocks={todayBlocks?.value ?? []}
          className="lg:col-span-7"
        />
        <NotepadWidget
          topicTitle={activeTopic?.Title ?? null}
          topicColor={activeTopic?.Color ?? FALLBACK_TOPIC_COLOR}
          notes={notesData?.value ?? []}
          className="lg:col-span-5"
        />
        <LibraryWidget
          documents={contextDocuments?.value ?? []}
          contextLabel={activeTopic?.Title ?? "All topics"}
          className="lg:col-span-4"
        />
        <AnalyticsWidget
          weekBlocks={weekBlocks?.value ?? []}
          documents={documentsData?.value ?? []}
          topics={topics}
          className="lg:col-span-8"
        />
      </div>
    </div>
  );
}

function WidgetHeader({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
        <Link href={href}>
          {linkLabel}
          <ArrowRight className="size-3" />
        </Link>
      </Button>
    </CardHeader>
  );
}

function TodayTimelineWidget({
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

function NotepadWidget({
  topicTitle,
  topicColor,
  notes,
  className,
}: {
  topicTitle: string | null;
  topicColor: string;
  notes: { Id: string; Title: string; UpdatedAt: string }[];
  className?: string;
}) {
  return (
    <Card
      className={cn("shadow-sm", className)}
      style={
        topicTitle
          ? { borderTopColor: topicColor, borderTopWidth: 3 }
          : undefined
      }
    >
      <WidgetHeader
        title={topicTitle ? `Notes — ${topicTitle}` : "Notes"}
        href="/notes"
        linkLabel="Open workspace"
      />
      <CardContent>
        {!topicTitle ? (
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <NotebookPen className="size-6" />
            <p className="text-center text-sm">
              Pick a topic in the top bar to start focused notes.
            </p>
          </div>
        ) : notes.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No notes in this context yet.
          </p>
        ) : (
          <div className="space-y-1">
            {notes.map((note) => (
              <Link
                key={note.Id}
                href="/notes"
                className="block rounded-md px-3 py-2 hover:bg-accent"
              >
                <p className="truncate text-sm font-medium">{note.Title}</p>
                <p className="text-xs text-muted-foreground">
                  {dayjs(note.UpdatedAt).format("MMM D, HH:mm")}
                </p>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LibraryWidget({
  documents,
  contextLabel,
  className,
}: {
  documents: { Id: string; Title: string; Status: string }[];
  contextLabel: string;
  className?: string;
}) {
  return (
    <Card className={cn("shadow-sm", className)}>
      <WidgetHeader
        title={`Library — ${contextLabel}`}
        href="/library"
        linkLabel="Open library"
      />
      <CardContent>
        {documents.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No documents in this context.
          </p>
        ) : (
          <div className="space-y-1">
            {documents.map((doc) => (
              <div
                key={doc.Id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5"
              >
                <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {doc.Title}
                </span>
                {doc.Status === "Completed" && (
                  <CheckCircle className="size-3.5 shrink-0 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AnalyticsWidget({
  weekBlocks,
  documents,
  topics,
  className,
}: {
  weekBlocks: StudyBlock[];
  documents: { TopicId: string; Status: string }[];
  topics: { Id: string; Title: string; Color: string | null }[];
  className?: string;
}) {
  const doneBlocks = weekBlocks.filter((b) => b.Status === "Done");
  const focusMinutes = doneBlocks.reduce((sum, b) => sum + blockMinutes(b), 0);
  const pastBlocks = weekBlocks.filter((b) =>
    dayjs(b.StartAt).isBefore(dayjs()),
  );
  const adherence = pastBlocks.length
    ? Math.round(
        (pastBlocks.filter((b) => b.Status === "Done").length /
          pastBlocks.length) *
          100,
      )
    : null;
  const completedDocs = documents.filter(
    (d) => d.Status === "Completed",
  ).length;
  const completionRate = documents.length
    ? Math.round((completedDocs / documents.length) * 100)
    : null;

  // Consecutive days (ending today) with at least one completed block.
  let streak = 0;
  for (let i = 0; i < 7; i++) {
    const day = dayjs().startOf("day").subtract(i, "day");
    const hasDone = doneBlocks.some((b) => dayjs(b.StartAt).isSame(day, "day"));
    if (hasDone) streak++;
    else if (i > 0) break;
  }

  const weekStart = dayjs().startOf("week");
  const perDay = Array.from({ length: 7 }, (_, i) => {
    const day = weekStart.add(i, "day");
    const minutes = doneBlocks
      .filter((b) => dayjs(b.StartAt).isSame(day, "day"))
      .reduce((sum, b) => sum + blockMinutes(b), 0);
    return { label: day.format("dd"), minutes };
  });
  const maxMinutes = Math.max(...perDay.map((d) => d.minutes), 1);
  const maxIndex = perDay.findIndex((d) => d.minutes === maxMinutes);

  const perTopic = topics
    .map((topic) => {
      const topicDocs = documents.filter((d) => d.TopicId === topic.Id);
      const done = topicDocs.filter((d) => d.Status === "Completed").length;
      return {
        ...topic,
        total: topicDocs.length,
        percent: topicDocs.length
          ? Math.round((done / topicDocs.length) * 100)
          : 0,
      };
    })
    .filter((t) => t.total > 0)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 5);

  const stats = [
    {
      title: "Focus time (week)",
      value: `${Math.floor(focusMinutes / 60)}h ${focusMinutes % 60}m`,
      icon: Timer,
    },
    {
      title: "Study streak",
      value: `${streak} day${streak === 1 ? "" : "s"}`,
      icon: Flame,
    },
    {
      title: "Doc completion",
      value: completionRate === null ? "—" : `${completionRate}%`,
      icon: CheckCircle,
    },
    {
      title: "Adherence",
      value: adherence === null ? "—" : `${adherence}%`,
      icon: Target,
    },
  ];

  return (
    <Card className={cn("shadow-sm", className)}>
      <WidgetHeader title="Analytics" href="/timeline" linkLabel="This week" />
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.title} className="rounded-lg border p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <stat.icon className="size-3.5" />
                {stat.title}
              </div>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Weekly focus (completed, minutes)
            </p>
            <div className="flex h-28 items-end gap-2">
              {perDay.map((day, index) => (
                <div
                  key={day.label}
                  className="flex flex-1 flex-col items-center gap-1"
                  title={`${day.label}: ${day.minutes} min`}
                >
                  {index === maxIndex && day.minutes > 0 && (
                    <span className="text-[10px] tabular-nums text-muted-foreground">
                      {day.minutes}
                    </span>
                  )}
                  <div
                    className="w-full max-w-6 rounded-t"
                    style={{
                      height: `${Math.max((day.minutes / maxMinutes) * 80, day.minutes > 0 ? 4 : 2)}px`,
                      backgroundColor:
                        day.minutes > 0 ? WEEK_CHART_HUE : "var(--muted)",
                    }}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Topic progress (documents completed)
            </p>
            {perTopic.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                Add documents to topics to see progress.
              </p>
            ) : (
              <div className="space-y-2.5">
                {perTopic.map((topic) => (
                  <div
                    key={topic.Id}
                    title={`${topic.Title}: ${topic.percent}%`}
                  >
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 truncate">
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              topic.Color ?? FALLBACK_TOPIC_COLOR,
                          }}
                        />
                        {topic.Title}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {topic.percent}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${topic.percent}%`,
                          backgroundColor: topic.Color ?? FALLBACK_TOPIC_COLOR,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
