"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/data-table";
import { cn } from "@/lib/utils";
import { getDocumentsColumns } from "./documents-columns";
import type { DocumentsTableProps } from "./documents-columns.props";
import { libraryCardClassName } from "./library-card";

export function DocumentsTable({
  documents,
  topicId,
  onSettings,
}: DocumentsTableProps) {
  const router = useRouter();

  const columns = useMemo(
    () => getDocumentsColumns({ topicId, onSettings }),
    [topicId, onSettings],
  );

  return (
    <DataTable
      columns={columns}
      data={documents}
      showToolbar={false}
      showPagination={false}
      className={cn("h-auto border-0 shadow-none", libraryCardClassName)}
      onRowClick={(doc) => router.push(`/library/${topicId}/${doc.Id}`)}
      getRowId={(doc) => doc.Id}
      emptyTitle="No files here yet"
      emptyDescription="Write a Markdown page or upload a file."
    />
  );
}
