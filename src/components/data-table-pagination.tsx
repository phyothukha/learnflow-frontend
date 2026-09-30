"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const MAX_PAGE_BUTTONS = 7;
const ELLIPSIS = "ellipsis";

type PageItem = number | `${typeof ELLIPSIS}-${"start" | "end"}`;

/** 0-indexed pages to render, e.g. [0, "ellipsis-start", 4, 5, 6, "ellipsis-end", 11]. */
function pageItems(page: number, pageCount: number): PageItem[] {
  if (pageCount <= MAX_PAGE_BUTTONS)
    return Array.from({ length: pageCount }, (_, i) => i);

  const last = pageCount - 1;
  const start = Math.min(Math.max(page - 1, 1), last - 3);
  const end = Math.max(Math.min(page + 1, last - 1), 3);
  const middle = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return [
    0,
    ...(start > 1 ? [`${ELLIPSIS}-start` as const] : []),
    ...middle,
    ...(end < last - 1 ? [`${ELLIPSIS}-end` as const] : []),
    last,
  ];
}

export interface DataTablePaginationProps {
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function DataTablePagination({
  page,
  total,
  limit,
  onPageChange,
  onLimitChange,
}: DataTablePaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : page * limit + 1;
  const to = Math.min((page + 1) * limit, total);

  return (
    <div className="relative z-20 flex items-center justify-between gap-3 border-t px-3 py-3 sm:px-4">
      <div className="flex items-center gap-3 text-sm whitespace-nowrap text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline">Results per page</span>
          <span className="sm:hidden">Rows</span>
          <Select
            value={String(limit)}
            onValueChange={(value) => onLimitChange(Number(value))}
          >
            <SelectTrigger size="sm" className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              position="popper"
              side="top"
              align="start"
              sideOffset={6}
              className="z-[200]"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="hidden tabular-nums md:inline">
          {from}–{to} of {total}
        </span>
      </div>

      <nav aria-label="Pagination" className="flex shrink-0 items-center gap-1">
        <Button
          variant="secondary"
          size="icon-sm"
          aria-label="Previous page"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        {pageItems(page, pageCount).map((item) =>
          typeof item === "number" ? (
            <Button
              key={item}
              variant={item === page ? "default" : "ghost"}
              size="icon-sm"
              aria-label={`Page ${item + 1}`}
              aria-current={item === page ? "page" : undefined}
              onClick={() => item !== page && onPageChange(item)}
              className="tabular-nums"
            >
              {item + 1}
            </Button>
          ) : (
            <span
              key={item}
              aria-hidden
              className="flex size-8 items-center justify-center text-muted-foreground"
            >
              <MoreHorizontal className="size-4" />
            </span>
          ),
        )}
        <Button
          variant="secondary"
          size="icon-sm"
          aria-label="Next page"
          disabled={page + 1 >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </nav>
    </div>
  );
}
