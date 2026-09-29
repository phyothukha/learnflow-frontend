"use client";

import { Check, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface TagFilterProps {
  tags: string[];
  value: string | null;
  onChange: (tag: string | null) => void;
}

export function TagFilter({ tags, value, onChange }: TagFilterProps) {
  if (tags.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={value ? "default" : "secondary"}
          size="sm"
          className="h-8"
        >
          <Tag className="size-3.5" />
          {value ?? "All tags"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-72 w-48 overflow-y-auto"
      >
        <DropdownMenuItem onClick={() => onChange(null)}>
          <Check className={cn(!value ? "opacity-100" : "opacity-0")} />
          All tags
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {tags.map((tag) => (
          <DropdownMenuItem key={tag} onClick={() => onChange(tag)}>
            <Check
              className={cn(value === tag ? "opacity-100" : "opacity-0")}
            />
            {tag}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
