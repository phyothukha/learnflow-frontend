"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DataTableColumnHeader } from "@/components/data-table-column-header";
import { DataTableEmptyState } from "@/components/data-table-empty-state";
import { DataTablePagination } from "@/components/data-table-pagination";
import {
  getSelectColumn,
  SELECT_COLUMN_ID,
} from "@/components/data-table-select-column";
import { DataTableToolbar } from "@/components/data-table-toolbar";

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  isLoading?: boolean;
  /** Shown in the toolbar, e.g. "Total Courses (12)" */
  title?: string;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  page?: number;
  /** Total rows across all pages. */
  total?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  onRowClick?: (row: TData) => void;
  getRowId?: (row: TData, index: number) => string;
  className?: string;
  showToolbar?: boolean;
  showPagination?: boolean;
  /** Row selection checkboxes (default true). */
  showCheckbox?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  /** Passing `onSortingChange` switches to server-side (manual) sorting. */
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  skeletonRows?: number;
}

export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  title,
  search,
  onSearchChange,
  searchPlaceholder,
  page = 0,
  total = 0,
  limit = 10,
  onPageChange,
  onLimitChange,
  columnVisibility,
  onColumnVisibilityChange,
  emptyIcon,
  emptyTitle,
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
  sorting: controlledSorting,
  onSortingChange,
}: DataTableProps<TData>) {
  const [uncontrolledRowSelection, setUncontrolledRowSelection] =
    useState<RowSelectionState>({});
  const [uncontrolledSorting, setUncontrolledSorting] = useState<SortingState>(
    [],
  );

  const manualSorting = !!onSortingChange;
  const sorting = controlledSorting ?? uncontrolledSorting;

  // Row ids default to the row index, so a selection must not survive a page/search/sort change.
  const selectionScope = `${page}:${limit}:${search ?? ""}:${
    manualSorting ? JSON.stringify(sorting) : ""
  }`;
  const [prevSelectionScope, setPrevSelectionScope] = useState(selectionScope);
  if (prevSelectionScope !== selectionScope) {
    setPrevSelectionScope(selectionScope);
    setUncontrolledRowSelection({});
  }

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
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    manualSorting,
    enableMultiSort: !manualSorting,
    onSortingChange: onSortingChange ?? setUncontrolledSorting,
    sortDescFirst: false,
    getRowId,
    enableRowSelection: showCheckbox,
    onRowSelectionChange: setRowSelection,
    state: {
      columnVisibility,
      rowSelection,
      sorting,
    },
    onColumnVisibilityChange,
  });

  const hasRows = table.getRowModel().rows.length > 0;
  const showEmpty = !isLoading && !hasRows;
  const selectedCount = showCheckbox
    ? table.getSelectedRowModel().rows.length
    : 0;

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col rounded-xl border bg-card",
        className,
      )}
    >
      {showToolbar && (title || onSearchChange) && (
        <DataTableToolbar
          title={title}
          selectedCount={selectedCount}
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
        />
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <Table className="w-max min-w-full md:w-full md:table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={
                      header.column.id === SELECT_COLUMN_ID
                        ? { width: 40 }
                        : undefined
                    }
                  >
                    {header.isPlaceholder ? null : (
                      <DataTableColumnHeader header={header} />
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
                              column.id === SELECT_COLUMN_ID
                                ? "size-4"
                                : "w-full",
                            )}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() ? "selected" : undefined}
                      className={cn(onRowClick && "cursor-pointer")}
                      onClick={
                        onRowClick ? () => onRowClick(row.original) : undefined
                      }
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          onClick={
                            cell.column.id === SELECT_COLUMN_ID
                              ? (e) => e.stopPropagation()
                              : undefined
                          }
                        >
                          {cell.column.id === SELECT_COLUMN_ID ? (
                            flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )
                          ) : (
                            <div className="max-w-64 min-w-0 md:max-w-none">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </div>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
            </TableBody>
          )}
        </Table>

        {showEmpty && (
          <DataTableEmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
            action={emptyAction}
          />
        )}
      </div>

      {showPagination && onPageChange && onLimitChange && (
        <DataTablePagination
          page={page}
          total={total}
          limit={limit}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />
      )}
    </div>
  );
}
