import type { ReactNode } from "react";
import type {
  ColumnDef,
  OnChangeFn,
  RowSelectionState,
  VisibilityState,
} from "@tanstack/react-table";
import type { LucideIcon } from "lucide-react";

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
  pageCount?: number;
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
  skeletonRows?: number;
}
