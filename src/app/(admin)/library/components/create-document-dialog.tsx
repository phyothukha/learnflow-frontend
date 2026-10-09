"use client";

import { useState } from "react";
import { isAxiosError } from "axios";
import { FilePlus2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagInput } from "@/components/tag-input";
import {
  CREATE_DOCUMENT_MODES,
  CreateDocumentMode,
} from "@/lib/document-create-modes";
import { cn } from "@/lib/utils";
import { formatSize } from "@/utils/format";
import {
  ACCEPT_ATTRIBUTE,
  getExtension,
  isSupportedExtension,
  isTextExtension,
  MAX_TEXT_BYTES,
  MAX_UPLOAD_BYTES,
  stripExtension,
  SUPPORTED_EXTENSIONS,
} from "@/lib/document-types";
import {
  useCreateDocument,
  useDeleteDocument,
  useUpdateDocument,
  useUploadAttachment,
} from "@/store/server/documents/mutations";
import type { StudyDocument } from "@/store/server/documents/interface";

interface FolderOption {
  id: string;
  label: string;
}

export interface CreateDocumentDialogProps {
  topicId: string;
  defaultFolderId: string | null;
  folderOptions: FolderOption[];
  onCreated?: (document: StudyDocument, mode: CreateDocumentMode) => void;
}

export function CreateDocumentDialog({
  topicId,
  defaultFolderId,
  folderOptions,
  onCreated,
}: CreateDocumentDialogProps) {
  const createDocument = useCreateDocument();
  const updateDocument = useUpdateDocument();
  const deleteDocument = useDeleteDocument();
  const uploadAttachment = useUploadAttachment();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<CreateDocumentMode>(
    CreateDocumentMode.Write,
  );
  const [title, setTitle] = useState("");
  const [folderId, setFolderId] = useState("none");
  const [tags, setTags] = useState<string[]>([]);
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setMode(CreateDocumentMode.Write);
    setTitle("");
    setTags([]);
    setUrl("");
    setFile(null);
    setFolderId(defaultFolderId ?? "none");
  };

  const handleOpenChange = (next: boolean) => {
    if (submitting) return;
    if (next) reset();
    setOpen(next);
  };

  const pickFile = (picked: File | undefined) => {
    if (!picked) return;
    const extension = getExtension(picked.name);
    if (!isSupportedExtension(extension)) {
      toast.error(
        `Unsupported file type. Use ${SUPPORTED_EXTENSIONS.map((e) => `.${e}`).join(", ")}`,
      );
      return;
    }
    const limit = isTextExtension(extension)
      ? MAX_TEXT_BYTES
      : MAX_UPLOAD_BYTES;
    if (picked.size > limit) {
      toast.error(`File is too large (max ${formatSize(limit)})`);
      return;
    }
    setFile(picked);
    if (!title.trim()) setTitle(stripExtension(picked.name));
  };

  const baseFields = () => ({
    TopicId: topicId,
    FolderId: folderId === "none" ? undefined : folderId,
    Title: title.trim(),
    Tags: tags,
  });

  const uploadBinary = async (picked: File, extension: string) => {
    const document = await createDocument.mutateAsync({
      ...baseFields(),
      FileType: extension,
    });
    try {
      const attachment = await uploadAttachment.mutateAsync({
        documentId: document.Id,
        file: picked,
      });
      return await updateDocument.mutateAsync({
        id: document.Id,
        payload: { FileUrl: attachment.Url },
      });
    } catch (error) {
      await deleteDocument.mutateAsync(document.Id).catch(() => undefined);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (mode === CreateDocumentMode.Upload && !file) {
      toast.error("Choose a file to upload");
      return;
    }
    if (mode === CreateDocumentMode.Link && !url.trim()) {
      toast.error("URL is required");
      return;
    }

    setSubmitting(true);
    try {
      let document: StudyDocument;
      if (mode === CreateDocumentMode.Write) {
        document = await createDocument.mutateAsync({
          ...baseFields(),
          FileType: "md",
          Content: `# ${title.trim()}\n\n`,
        });
      } else if (mode === CreateDocumentMode.Link) {
        document = await createDocument.mutateAsync({
          ...baseFields(),
          FileType: "link",
          FileUrl: url.trim(),
        });
      } else {
        const extension = getExtension(file!.name);
        document = isTextExtension(extension)
          ? await createDocument.mutateAsync({
              ...baseFields(),
              FileType: extension,
              Content: await file!.text(),
            })
          : await uploadBinary(file!, extension);
      }
      toast.success("Document created");
      setOpen(false);
      onCreated?.(document, mode);
    } catch (error) {
      const status = isAxiosError(error) ? error.response?.status : undefined;
      toast.error(
        status === 501
          ? "File storage isn't configured on the server yet"
          : "Failed to create document",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <FilePlus2 />
          New document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New document</DialogTitle>
          <DialogDescription>
            Write in Markdown, upload a file, or save a link.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2">
          {Array.from(CREATE_DOCUMENT_MODES, ([value, option]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={cn(
                "flex min-w-0 flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors hover:bg-accent",
                mode === value &&
                  "border-primary bg-accent ring-1 ring-primary",
              )}
            >
              <option.icon className="size-4" />
              <span className="text-sm font-medium">{option.label}</span>
              <span className="w-full truncate text-[11px] leading-tight text-muted-foreground">
                {option.description}
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {mode === CreateDocumentMode.Upload && (
            <FileDropzone
              accept={ACCEPT_ATTRIBUTE}
              description={`Maximum file size ${formatSize(MAX_UPLOAD_BYTES)}. ${SUPPORTED_EXTENSIONS.map((e) => `.${e}`).join(", ")}`}
              files={file ? [file] : []}
              onFiles={(picked) => pickFile(picked[0])}
              onRemove={() => setFile(null)}
              disabled={submitting}
            />
          )}

          <div className="space-y-2">
            <Label htmlFor="new-doc-title">Title</Label>
            <Input
              id="new-doc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                mode === CreateDocumentMode.Write
                  ? "e.g. Lecture 3 summary"
                  : "Document title"
              }
            />
          </div>

          {mode === CreateDocumentMode.Link && (
            <div className="space-y-2">
              <Label htmlFor="new-doc-url">URL</Label>
              <Input
                id="new-doc-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
          )}

          {folderOptions.length > 0 && (
            <div className="space-y-2">
              <Label>Folder</Label>
              <Select value={folderId} onValueChange={setFolderId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No folder</SelectItem>
                  {folderOptions.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Tags</Label>
            <TagInput value={tags} onChange={setTags} />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {CREATE_DOCUMENT_MODES.get(mode)?.submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
