import { FileSearch, FolderOpen } from "lucide-react";

interface FilesEmptyStateProps {
  searching: boolean;
  filtered: boolean;
}

export function FilesEmptyState({ searching, filtered }: FilesEmptyStateProps) {
  const Icon = searching ? FileSearch : FolderOpen;

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-card py-16 text-center text-muted-foreground">
      <Icon className="size-8" />
      <p className="text-sm font-medium text-foreground">
        {filtered ? "No matching files" : "No files here yet"}
      </p>
      <p className="text-xs">
        {filtered
          ? "Try a different search or clear the filters."
          : "Write a Markdown page or upload a PDF, Word, PowerPoint or CSV file."}
      </p>
    </div>
  );
}
