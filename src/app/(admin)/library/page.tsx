"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  BookOpen,
  Code2,
  FlaskConical,
  Library,
  Lightbulb,
  Palette,
  Plus,
  Search,
  Trash2,
  type LucideIcon,
} from "lucide-react";

dayjs.extend(relativeTime);
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/client/workspace";
import { useFetchTopics } from "@/store/server/topics/queries";
import { useFetchDocuments } from "@/store/server/documents/queries";
import {
  useCreateTopic,
  useDeleteTopic,
} from "@/store/server/topics/mutations";
import type { Topic } from "@/store/server/topics/interface";
import {
  FALLBACK_TOPIC_COLOR as FALLBACK_COLOR,
  TOPIC_COLORS,
} from "@/lib/topic-colors";
import { libraryCardClassName } from "./components/library-card";

type SortMode = "recent" | "name" | "created";

const SORT_TABS: { value: SortMode; label: string }[] = [
  { value: "recent", label: "Recently updated" },
  { value: "name", label: "Name A–Z" },
  { value: "created", label: "Newest" },
];

function sortTopics(topics: Topic[], mode: SortMode) {
  return [...topics].sort((a, b) => {
    if (mode === "name") return a.Title.localeCompare(b.Title);
    const key = mode === "recent" ? "UpdatedAt" : "CreatedAt";
    return dayjs(b[key]).valueOf() - dayjs(a[key]).valueOf();
  });
}

export default function LibraryPage() {
  const router = useRouter();
  const { status } = useSession();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.DOCUMENTS_VIEW);

  const activeTopicId = useWorkspaceStore((s) => s.activeTopicId);
  const setActiveTopic = useWorkspaceStore((s) => s.setActiveTopic);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortMode>("recent");

  const { data: topicsData, isLoading } = useFetchTopics({ limit: 100 });
  const { data: documentsData } = useFetchDocuments({ limit: 500 });
  const deleteTopic = useDeleteTopic();

  const fileCountByTopic = useMemo(() => {
    const counts = new Map<string, number>();
    for (const doc of documentsData?.Items ?? []) {
      counts.set(doc.TopicId, (counts.get(doc.TopicId) ?? 0) + 1);
    }
    return counts;
  }, [documentsData?.Items]);

  useEffect(() => {
    if (status === "authenticated" && !canView) router.replace("/forbidden");
  }, [status, canView, router]);

  if (status !== "authenticated" || !canView) return null;

  const topics = topicsData?.Items ?? [];
  const query = search.trim().toLowerCase();
  const visibleTopics = sortTopics(
    query
      ? topics.filter(
          (t) =>
            t.Title.toLowerCase().includes(query) ||
            t.Description?.toLowerCase().includes(query),
        )
      : topics,
    sort,
  );

  const handleDelete = (topic: Topic) => {
    if (!window.confirm(`Delete "${topic.Title}" and all its documents?`))
      return;
    deleteTopic.mutate(topic.Id, {
      onSuccess: () => {
        if (activeTopicId === topic.Id) setActiveTopic(null);
        toast.success("Topic deleted");
      },
      onError: () => toast.error("Failed to delete topic"),
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Library className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Library</h1>
            <p className="text-sm text-muted-foreground">
              {topics.length} {topics.length === 1 ? "topic" : "topics"} · pick
              one to open its folders and documents
            </p>
          </div>
        </div>
        <CreateTopicDialog />
      </div>

      <div className={cn("space-y-3 p-3", libraryCardClassName)}>
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search topics by name or description…"
            className="h-10 bg-background pl-9"
          />
        </div>
        <div className="flex gap-1 border-b">
          {SORT_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setSort(tab.value)}
              className={cn(
                "-mb-px border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground",
                sort === tab.value &&
                  "border-primary font-medium text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[220px] rounded-xl" />
          ))}
        </div>
      ) : topics.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <div className="rounded-2xl bg-muted p-4">
            <Library className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No topics yet</p>
          <p className="text-xs text-muted-foreground">
            Create a topic to start organizing your study materials.
          </p>
        </div>
      ) : visibleTopics.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No topics match “{search}”.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {visibleTopics.map((topic) => (
            <TopicCard
              key={topic.Id}
              topic={topic}
              fileCount={fileCountByTopic.get(topic.Id) ?? 0}
              isActive={activeTopicId === topic.Id}
              onOpen={() => setActiveTopic(topic.Id)}
              onDelete={() => handleDelete(topic)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const TOPIC_ICONS: LucideIcon[] = [
  Palette,
  BookOpen,
  Code2,
  FlaskConical,
  Lightbulb,
  Library,
];

function topicIcon(topicId: string): LucideIcon {
  let hash = 0;
  for (let i = 0; i < topicId.length; i++)
    hash = (hash + topicId.charCodeAt(i) * (i + 1)) % TOPIC_ICONS.length;
  return TOPIC_ICONS[hash]!;
}

function topicInitials(title: string) {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((word) => word.charAt(0).toUpperCase());
}

function TopicCard({
  topic,
  fileCount,
  isActive,
  onOpen,
  onDelete,
}: {
  topic: Topic;
  fileCount: number;
  isActive: boolean;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const color = topic.Color ?? FALLBACK_COLOR;
  const Icon = topicIcon(topic.Id);
  const initials = topicInitials(topic.Title);
  const shown = initials.slice(0, 3);
  const extra = Math.max(0, initials.length - shown.length);

  return (
    <Link
      href={`/library/${topic.Id}`}
      onClick={onOpen}
      className={cn(
        "group relative flex flex-col gap-5 p-5 transition-all hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(15,23,42,0.12)]",
        libraryCardClassName,
        isActive && "ring-2 ring-primary/30",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="line-clamp-2 min-w-0 text-base leading-snug font-semibold text-foreground">
          {topic.Title}
        </h2>
        <div className="flex shrink-0 items-center gap-1">
          <span className="text-xs whitespace-nowrap text-muted-foreground">
            {fileCount.toLocaleString()} {fileCount === 1 ? "File" : "Files"}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
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
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <p className="text-[11px] font-medium text-muted-foreground">
            {isActive ? "Current context" : "Topic"}
          </p>
          <div className="flex items-center">
            {shown.map((letter, i) => (
              <span
                key={`${letter}-${i}`}
                className="flex size-7 items-center justify-center rounded-full border-2 border-card text-[11px] font-semibold text-white"
                style={{
                  backgroundColor: color,
                  marginLeft: i === 0 ? 0 : -8,
                  filter: i ? `brightness(${1 - i * 0.08})` : undefined,
                }}
              >
                {letter}
              </span>
            ))}
            {(extra > 0 || fileCount > 3) && (
              <span
                className="flex size-7 items-center justify-center rounded-full border-2 border-card text-[10px] font-semibold"
                style={{
                  marginLeft: -8,
                  backgroundColor: `${color}22`,
                  color,
                }}
              >
                +{extra > 0 ? extra : Math.min(fileCount, 9)}
              </span>
            )}
          </div>
        </div>

        <div
          className="flex size-14 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${color}1f`, color }}
        >
          <Icon className="size-7" strokeWidth={1.75} />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Last updated — {dayjs(topic.UpdatedAt).fromNow()}
      </p>
    </Link>
  );
}

function CreateTopicDialog() {
  const createTopic = useCreateTopic();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<string>(TOPIC_COLORS[0]);

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    createTopic.mutate(
      {
        Title: title.trim(),
        Description: description.trim() || undefined,
        Color: color,
      },
      {
        onSuccess: () => {
          toast.success("Topic created");
          setTitle("");
          setDescription("");
          setOpen(false);
        },
        onError: () => toast.error("Failed to create topic"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New topic
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New topic</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic-title">Title</Label>
            <Input
              id="topic-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Machine Learning"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="topic-description">Description</Label>
            <Textarea
              id="topic-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Accent color</Label>
            <div className="flex gap-2">
              {TOPIC_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={cn(
                    "size-6 rounded-full border-2",
                    color === c ? "border-foreground" : "border-transparent",
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={createTopic.isPending}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
