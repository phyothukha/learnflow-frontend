"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Library, Plus, Search, Trash2 } from "lucide-react";

dayjs.extend(relativeTime);
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
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
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { AnimatedTabs, type AnimatedTab } from "@/components/animated-tabs";
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

enum SortMode {
  Recent = "recent",
  Name = "name",
  Created = "created",
}

const SORT_TABS: AnimatedTab<SortMode>[] = [
  { value: SortMode.Recent, label: "Recently updated" },
  { value: SortMode.Name, label: "Name A–Z" },
  { value: SortMode.Created, label: "Newest" },
];

function sortTopics(topics: Topic[], mode: SortMode) {
  return [...topics].sort((a, b) => {
    if (mode === SortMode.Name) return a.Title.localeCompare(b.Title);
    const key = mode === SortMode.Recent ? "UpdatedAt" : "CreatedAt";
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
  const [sort, setSort] = useState<SortMode>(SortMode.Recent);

  const { data: topicsData, isLoading } = useFetchTopics({ limit: 100 });
  const { data: documentsData } = useFetchDocuments({ limit: 500 });
  const deleteTopic = useDeleteTopic();
  const { confirmDelete, dialogProps } = useConfirmDialog();

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

  const handleDelete = (topic: Topic) =>
    confirmDelete({
      itemName: topic.Title,
      description:
        "All of its folders and documents will be deleted too. This action cannot be undone.",
      successMessage: "Topic deleted",
      errorMessage: "Failed to delete topic",
      onConfirm: async () => {
        await deleteTopic.mutateAsync(topic.Id);
        if (activeTopicId === topic.Id) setActiveTopic(null);
      },
    });

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Library"
          description="Browse topics and open folders to manage your files"
          badge={
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary tabular-nums">
              {topics.length} {topics.length === 1 ? "topic" : "topics"}
            </span>
          }
          actions={<CreateTopicDialog />}
          className="border-b pb-5"
        />

        <div className="library-card space-y-3 p-3">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topics by name or description…"
              className="h-10 bg-background pl-9"
            />
          </div>
          <AnimatedTabs
            value={sort}
            onValueChange={setSort}
            tabs={SORT_TABS}
            className="border-border/80"
            tabClassName="px-3 py-2"
          />
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[160px] rounded-xl" />
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
      <ConfirmDialog {...dialogProps} />
    </>
  );
}

interface TopicCardProps {
  topic: Topic;
  fileCount: number;
  isActive: boolean;
  onOpen: () => void;
  onDelete: () => void;
}

function TopicCard({
  topic,
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
        "library-card",
        "group relative flex flex-col border-2 border-transparent transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_44px_rgba(15,23,42,0.1)]",
        isActive && "border-primary",
      )}
    >
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <div className="flex items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              <h2 className="truncate text-base font-semibold text-foreground">
                {topic.Title}
              </h2>
            </div>
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {topic.Description?.trim() ||
                "No description yet for this topic."}
            </p>
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

        <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
          <span>
            {fileCount.toLocaleString()} {fileCount === 1 ? "file" : "files"}
          </span>
          <span className="truncate">
            Updated {dayjs(topic.UpdatedAt).fromNow()}
          </span>
        </div>
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
