"use client";

import { flexRender, type Header } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DataTableColumnHeaderProps<TData> {
  header: Header<TData, unknown>;
}

export function DataTableColumnHeader<TData>({
  header,
}: DataTableColumnHeaderProps<TData>) {
  const content = flexRender(
    header.column.columnDef.header,
    header.getContext(),
  );
  if (!header.column.getCanSort()) return content;

  const sorted = header.column.getIsSorted();
  const Icon =
    sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ChevronsUpDown;
  const label =
    sorted === "asc"
      ? "Sorted ascending, click to sort descending"
      : sorted === "desc"
        ? "Sorted descending, click to clear sorting"
        : "Click to sort ascending";

  return (
    <button
      type="button"
      onClick={header.column.getToggleSortingHandler()}
      title={label}
      aria-label={label}
      className={cn(
        "-ml-2 inline-flex max-w-full items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-muted hover:text-foreground",
        sorted && "text-foreground",
      )}
    >
      <span className="truncate">{content}</span>
      <Icon
        className={cn(
          "size-3.5 shrink-0",
          sorted ? "text-primary" : "text-muted-foreground/60",
        )}
      />
    </button>
  );
}
