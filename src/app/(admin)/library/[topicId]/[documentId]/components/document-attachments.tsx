"use client";

import { useRef } from "react";
import { Download, Paperclip, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MAX_UPLOAD_BYTES } from "@/lib/document-types";
import type { StudyDocument } from "@/store/server/documents/interface";
import {
  useDeleteAttachment,
  useUploadAttachment,
} from "@/store/server/documents/mutations";
import { downloadFromUrl } from "../../../components/document-viewers";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface DocumentAttachmentsProps {
  document: StudyDocument;
}

export function DocumentAttachments({ document }: DocumentAttachmentsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAttachment = useUploadAttachment();
  const deleteAttachment = useDeleteAttachment();

  return (
    <div className="space-y-1.5">
      <Button
        variant="secondary"
        size="sm"
        className="h-7 w-full text-xs"
        disabled={uploadAttachment.isPending}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="size-3.5" />
        {uploadAttachment.isPending ? "Uploading…" : "Upload"}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          if (file.size > MAX_UPLOAD_BYTES) {
            toast.error("File is too large (max 25 MB)");
            return;
          }
          uploadAttachment.mutate(
            { documentId: document.Id, file },
            {
              onSuccess: () => toast.success("Attachment uploaded"),
              onError: () => toast.error("Failed to upload attachment"),
            },
          );
        }}
      />
      {document.Attachments.length === 0 ? (
        <p className="rounded-md border border-dashed py-3 text-center text-[11px] text-muted-foreground">
          No attachments
        </p>
      ) : (
        document.Attachments.map((attachment) => (
          <div
            key={attachment.Id}
            className="group flex items-center gap-1.5 rounded-md border bg-muted/30 px-2 py-1.5"
          >
            <Paperclip className="size-3 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs">{attachment.FileName}</p>
              <p className="text-[10px] text-muted-foreground">
                {formatSize(attachment.SizeBytes)}
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 text-muted-foreground hover:text-foreground"
              title="Download"
              aria-label="Download"
              onClick={() =>
                downloadFromUrl(attachment.Url, attachment.FileName)
              }
            >
              <Download className="size-3.5" />
            </button>
            <button
              type="button"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() =>
                deleteAttachment.mutate(
                  { documentId: document.Id, attachmentId: attachment.Id },
                  {
                    onSuccess: () => toast.success("Attachment removed"),
                    onError: () => toast.error("Failed to remove attachment"),
                  },
                )
              }
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))
      )}
    </div>
  );
}
