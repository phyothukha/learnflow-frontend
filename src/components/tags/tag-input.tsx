"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Badge, tagVariant } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useFetchTags } from "@/store/server/tags/queries";

export function TagInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
}) {
  const { data: allTags } = useFetchTags();
  const [draft, setDraft] = useState("");

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag || value.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...value, tag]);
    setDraft("");
  };

  const suggestions = (allTags ?? [])
    .map((t) => t.Name)
    .filter(
      (name) =>
        draft.trim().length > 0 &&
        name.toLowerCase().includes(draft.trim().toLowerCase()) &&
        !value.some((t) => t.toLowerCase() === name.toLowerCase()),
    )
    .slice(0, 5);

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {value.map((tag) => (
          <Badge key={tag} variant={tagVariant(tag)} className="gap-1">
            {tag}
            <button onClick={() => onChange(value.filter((t) => t !== tag))}>
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="relative">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag(draft);
            } else if (e.key === "Backspace" && !draft && value.length > 0) {
              onChange(value.slice(0, -1));
            }
          }}
          placeholder="Add a tag and press Enter…"
          className="h-8"
        />
        {suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
            {suggestions.map((name) => (
              <button
                key={name}
                className="block w-full rounded-sm px-2 py-1 text-left text-sm hover:bg-accent"
                onClick={() => addTag(name)}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
