"use client";

import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
} from "@tanstack/react-table";
import { Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/data-table-pagination";
import { cn } from "@/lib/utils";
import type { DataTableProps } from "./data-table.props";

function getSelectColumn<TData>(): ColumnDef<TData, unknown> {
  return {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-px"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        onClick={(e) => e.stopPropagation()}
        aria-label="Select row"
        className="translate-y-px"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  };
}

export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  title,
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  page = 0,
  pageCount = 1,
  limit = 10,
  onPageChange,
  onLimitChange,
  columnVisibility,
  onColumnVisibilityChange,
  emptyIcon: EmptyIcon,
  emptyTitle = "No results",
  emptyDescription,
  emptyAction,
  onRowClick,
  getRowId,
  className,
  showToolbar = true,
  showPagination = true,
  showCheckbox = true,
  skeletonRows = 5,
  rowSelection: controlledRowSelection,
  onRowSelectionChange,
}: DataTableProps<TData>) {
  const [uncontrolledRowSelection, setUncontrolledRowSelection] =
    useState<RowSelectionState>({});

  const rowSelection = controlledRowSelection ?? uncontrolledRowSelection;
  const setRowSelection = onRowSelectionChange ?? setUncontrolledRowSelection;

  const tableColumns = useMemo(() => {
    if (!showCheckbox) return columns;
    return [getSelectColumn<TData>(), ...columns];
  }, [columns, showCheckbox]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: showPagination,
    pageCount,
    getRowId,
    enableRowSelection: showCheckbox,
    onRowSelectionChange: setRowSelection,
    state: {
      columnVisibility,
      rowSelection,
    },
    onColumnVisibilityChange,
  });

  const hasRows = table.getRowModel().rows.length > 0;
  const showEmpty = !isLoading && !hasRows;
  const selectedCount = table.getSelectedRowModel().rows.length;

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col rounded-xl border bg-card",
        className,
      )}
    >
      {showToolbar && (title || onSearchChange) && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex min-w-0 items-center gap-2">
            {title ? <p className="font-semibold">{title}</p> : null}
            {showCheckbox && selectedCount > 0 && (
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {selectedCount} selected
              </span>
            )}
          </div>
          {onSearchChange && (
            <div className="relative w-full max-w-xs">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={search ?? ""}
                onChange={(e) => onSearchChange(e.target.value)}
                className="rounded-full pl-9"
              />
            </div>
          )}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={
                      header.column.id === "select" ? { width: 40 } : undefined
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          {(isLoading || hasRows) && (
            <TableBody>
              {isLoading
                ? Array.from({ length: skeletonRows }).map((_, i) => (
                    <TableRow key={i}>
                      {table.getVisibleLeafColumns().map((column) => (
                        <TableCell key={column.id}>
                          <Skeleton
                            className={cn(
                              "h-5",
                              column.id === "select" ? "size-4" : "w-full",
                            )}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className={cn(onRowClick && "cursor-pointer")}
                      onClick={
                        onRowClick ? () => onRowClick(row.original) : undefined
                      }
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
            </TableBody>
          )}
        </Table>

        {showEmpty && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            {EmptyIcon && (
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <EmptyIcon className="size-6 text-muted-foreground" />
              </div>
            )}
            <div className="space-y-1">
              <p className="font-medium">{emptyTitle}</p>
              {emptyDescription && (
                <p className="text-sm text-muted-foreground">
                  {emptyDescription}
                </p>
              )}
            </div>
            {emptyAction}
          </div>
        )}
      </div>

      {showPagination && onPageChange && onLimitChange && (
        <DataTablePagination
          page={page}
          pageCount={pageCount}
          limit={limit}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />
      )}
    </div>
  );
}
