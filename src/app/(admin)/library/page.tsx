"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Library } from "lucide-react";

dayjs.extend(relativeTime);
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { AnimatedTabs, type AnimatedTab } from "@/components/animated-tabs";
import { useWorkspaceStore } from "@/store/client/use-store";
import { useTopicMetaStore } from "@/store/client/topic-meta-store";
import { useFetchTopics } from "@/store/server/topics/queries";
import { useFetchDocuments } from "@/store/server/documents/queries";
import { useDeleteTopic } from "@/store/server/topics/mutations";
import type { Topic } from "@/store/server/topics/interface";
import { CreateTopicDialog } from "./components/create-topic-dialog";
import { TopicCard } from "./components/topic-card";

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

  const { activeTopicId, setActiveTopic } = useWorkspaceStore();
  const logos = useTopicMetaStore((state) => state.logos);
  const setLogoMeta = useTopicMetaStore((state) => state.setLogo);
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
        setLogoMeta(topic.Id, null);
        if (activeTopicId === topic.Id) setActiveTopic(null);
      },
    });

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Library"
          description="Store uploaded books and documents in one place. Viewing only — markdown notes live under Notes / Teams."
          badge={
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary tabular-nums">
              {topics.length} {topics.length === 1 ? "topic" : "topics"}
            </span>
          }
          actions={<CreateTopicDialog />}
          className="border-b pb-5"
        />

        {topics.length > 0 || isLoading ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search topics by name or description…"
            />
            <AnimatedTabs
              value={sort}
              onValueChange={setSort}
              tabs={SORT_TABS}
              className="border-border/80"
              tabClassName="px-3 py-2"
            />
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[220px] rounded-2xl" />
            ))}
          </div>
        ) : topics.length === 0 ? (
          <div className="library-card flex flex-col items-center gap-2 px-4 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
              <Library className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No topics yet</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Create a topic to start organizing your study materials.
            </p>
          </div>
        ) : visibleTopics.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No topics match “{search.trim()}”.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleTopics.map((topic) => (
              <TopicCard
                key={topic.Id}
                topic={topic}
                logo={logos[topic.Id] ?? null}
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
