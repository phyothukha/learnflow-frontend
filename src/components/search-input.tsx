"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
  inputClassName,
}: SearchInputProps) {
  const hasValue = value.length > 0;

  return (
    <div
      className={cn(
        "relative min-w-0 w-full rounded-full sm:w-72",
        "has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/50",
        className,
      )}
    >
      <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
      {!hasValue ? (
        <span
          aria-hidden
          title={placeholder}
          className="pointer-events-none absolute top-1/2 left-9 z-10 w-[calc(100%-4.5rem)] -translate-y-1/2 truncate text-sm text-muted-foreground"
        >
          {placeholder}
        </span>
      ) : null}
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder=""
        aria-label={placeholder}
        className={cn(
          "relative h-9 rounded-full bg-background pr-9 pl-9 shadow-none focus-visible:border-input focus-visible:ring-0",
          inputClassName,
        )}
      />
      {hasValue ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-2.5 z-10 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
