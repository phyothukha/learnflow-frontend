"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";
import {
  ArrowRight,
  Calendar,
  Clock,
  FileText,
  Library,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
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
import {
  useCreateTopic,
  useDeleteTopic,
} from "@/store/server/topics/mutations";
import type { Topic } from "@/store/server/topics/interface";
import {
  FALLBACK_TOPIC_COLOR as FALLBACK_COLOR,
  TOPIC_COLORS,
} from "@/lib/topic-colors";

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
  const deleteTopic = useDeleteTopic();

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

      <div className="space-y-3 rounded-xl border bg-card p-3 shadow-sm">
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleTopics.map((topic) => (
            <TopicCard
              key={topic.Id}
              topic={topic}
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

function TopicCard({
  topic,
  isActive,
  onOpen,
  onDelete,
}: {
  topic: Topic;
  isActive: boolean;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const color = topic.Color ?? FALLBACK_COLOR;

  return (
    <Link
      href={`/library/${topic.Id}`}
      onClick={onOpen}
      className="group flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-4"
          style={
            {
              backgroundColor: `${color}1f`,
              color,
              "--tw-ring-color": `${color}14`,
            } as React.CSSProperties
          }
        >
          {topic.Title.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{topic.Title}</p>
          {isActive && (
            <p className="text-[11px] font-medium text-primary">
              Current context
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          title="Delete topic"
          aria-label={`Delete ${topic.Title}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <dl className="space-y-2 rounded-lg border bg-muted/40 p-3 text-sm">
        <div className="flex items-start gap-2.5">
          <FileText className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
          <dd className="line-clamp-2 text-muted-foreground">
            {topic.Description || "No description"}
          </dd>
        </div>
        <div className="flex items-center gap-2.5">
          <Calendar className="size-3.5 shrink-0 text-muted-foreground" />
          <dd>Created {dayjs(topic.CreatedAt).format("MMM D, YYYY")}</dd>
        </div>
        <div className="flex items-center gap-2.5">
          <Clock className="size-3.5 shrink-0 text-muted-foreground" />
          <dd>Updated {dayjs(topic.UpdatedAt).format("MMM D, YYYY")}</dd>
        </div>
      </dl>

      <div className="flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: color }}
          />
          Topic
        </span>
        <span className="inline-flex items-center gap-1 font-medium text-muted-foreground transition-colors group-hover:text-foreground">
          Open topic
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
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
