"use client";

import { useRef, useState } from "react";
import { Download, Paperclip, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { TagInput } from "@/components/tags/tag-input";
import {
  useDeleteAttachment,
  useUpdateDocument,
  useUploadAttachment,
} from "@/store/server/documents/mutations";
import type { StudyDocument } from "@/store/server/documents/interface";

const MAX_ATTACHMENT_BYTES = 25_000_000;

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentDetailDialog({
  document,
  onClose,
}: {
  document: StudyDocument;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(document.Title);
  const [tags, setTags] = useState<string[]>(document.Tags);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateDocument = useUpdateDocument();
  const uploadAttachment = useUploadAttachment();
  const deleteAttachment = useDeleteAttachment();

  const isDirty =
    title !== document.Title ||
    JSON.stringify(tags) !== JSON.stringify(document.Tags);

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    updateDocument.mutate(
      { id: document.Id, payload: { Title: title.trim(), Tags: tags } },
      {
        onSuccess: () => toast.success("Document updated"),
        onError: () => toast.error("Failed to update document"),
      },
    );
  };

  const handleFileSelected = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Document details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="doc-detail-title">Title</Label>
            <Input
              id="doc-detail-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <TagInput value={tags} onChange={setTags} />
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Attachments</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadAttachment.isPending}
              >
                <Upload className="size-3.5" />
                Upload
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => handleFileSelected(e.target.files?.[0])}
              />
            </div>

            {document.Attachments.length === 0 ? (
              <p className="py-3 text-center text-xs text-muted-foreground">
                No attachments yet.
              </p>
            ) : (
              <div className="space-y-1.5">
                {document.Attachments.map((attachment) => (
                  <div
                    key={attachment.Id}
                    className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm"
                  >
                    <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">
                      {attachment.FileName}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatSize(attachment.SizeBytes)}
                    </span>
                    <a
                      href={attachment.Url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                    >
                      <Download className="size-3.5" />
                    </a>
                    <button
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        deleteAttachment.mutate(
                          {
                            documentId: document.Id,
                            attachmentId: attachment.Id,
                          },
                          {
                            onSuccess: () =>
                              toast.success("Attachment removed"),
                            onError: () =>
                              toast.error("Failed to remove attachment"),
                          },
                        )
                      }
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSave}
            disabled={!isDirty || updateDocument.isPending}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
