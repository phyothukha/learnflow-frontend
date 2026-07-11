"use client";

import { Check, ChevronsUpDown, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFetchTopics } from "@/store/server/topics/queries";
import { useWorkspaceStore } from "@/store/client/workspace";
import { cn } from "@/lib/utils";

const FALLBACK_COLOR = "#8b8b8b";

/**
 * The Active Topic Context switcher — the single source of truth for the
 * context-aware workspace. Notes and the library filter to this topic.
 */
export function TopicContextSwitcher() {
  const { data } = useFetchTopics({ limit: 100, orderby: "Title asc" });
  const activeTopicId = useWorkspaceStore((s) => s.activeTopicId);
  const setActiveTopic = useWorkspaceStore((s) => s.setActiveTopic);

  const topics = data?.value ?? [];
  const activeTopic = topics.find((t) => t.Id === activeTopicId) ?? null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 rounded-full">
          {activeTopic ? (
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: activeTopic.Color ?? FALLBACK_COLOR }}
            />
          ) : (
            <Layers className="size-3.5 text-muted-foreground" />
          )}
          <span className="max-w-36 truncate">
            {activeTopic?.Title ?? "All topics"}
          </span>
          <ChevronsUpDown className="size-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Active topic context</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setActiveTopic(null)}>
          <Layers className="size-4 text-muted-foreground" />
          All topics
          <Check
            className={cn(
              "ml-auto size-4",
              activeTopicId === null ? "opacity-100" : "opacity-0",
            )}
          />
        </DropdownMenuItem>
        {topics.map((topic) => (
          <DropdownMenuItem
            key={topic.Id}
            onClick={() => setActiveTopic(topic.Id)}
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: topic.Color ?? FALLBACK_COLOR }}
            />
            <span className="truncate">{topic.Title}</span>
            <Check
              className={cn(
                "ml-auto size-4",
                activeTopicId === topic.Id ? "opacity-100" : "opacity-0",
              )}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
