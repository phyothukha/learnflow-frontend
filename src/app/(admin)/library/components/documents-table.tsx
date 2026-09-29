"use client";

import { useRouter } from "next/navigation";
import { DataTable } from "@/components/data-table";
import type { StudyDocument } from "@/store/server/documents/interface";
import { columns } from "./columns";

interface DocumentsTableProps {
  documents: StudyDocument[];
}

export function DocumentsTable({ documents }: DocumentsTableProps) {
  const router = useRouter();

  return (
    <DataTable
      columns={columns}
      data={documents}
      showToolbar={false}
      showPagination={false}
      className="library-card h-auto border-0"
      onRowClick={(doc) => router.push(`/library/${doc.TopicId}/${doc.Id}`)}
      getRowId={(doc) => doc.Id}
      emptyTitle="No files here yet"
      emptyDescription="Write a Markdown page or upload a file."
    />
  );
}
