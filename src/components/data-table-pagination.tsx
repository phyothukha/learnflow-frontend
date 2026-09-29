"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export function DataTablePagination({
  page,
  pageCount,
  limit,
  onPageChange,
  onLimitChange,
}: {
  page: number;
  pageCount: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}) {
  return (
    <div className="relative z-20 flex items-center justify-between gap-3 border-t px-3 py-3 sm:px-4">
      <div className="flex items-center gap-2 text-sm whitespace-nowrap text-muted-foreground">
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

      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="secondary"
          size="icon-sm"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="flex size-8 items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground">
          {page + 1}
        </span>
        <Button
          variant="secondary"
          size="icon-sm"
          disabled={page + 1 >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
