"use client";

import { useRef, useState } from "react";
import { isAxiosError } from "axios";
import { FilePlus2, Link2, Loader2, PenLine, Upload, X } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DocumentKindIcon } from "@/components/document-kind-icon";
import { TagInput } from "@/components/tags/tag-input";
import { cn } from "@/lib/utils";
import {
  ACCEPT_ATTRIBUTE,
  getDocumentKind,
  getExtension,
  isSupportedExtension,
  isTextExtension,
  KIND_META,
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

export enum CreateDocumentMode {
  Write = "write",
  Upload = "upload",
  Link = "link",
}

interface ModeOption {
  value: CreateDocumentMode;
  label: string;
  description: string;
  icon: typeof PenLine;
}

interface FolderOption {
  id: string;
  label: string;
}

const MODES: ModeOption[] = [
  {
    value: CreateDocumentMode.Write,
    label: "Write",
    description: "New Markdown page",
    icon: PenLine,
  },
  {
    value: CreateDocumentMode.Upload,
    label: "Upload",
    description: "PDF, Word, PPT, CSV, MD",
    icon: Upload,
  },
  {
    value: CreateDocumentMode.Link,
    label: "Link",
    description: "External URL",
    icon: Link2,
  },
];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const fileKind = file ? getDocumentKind(getExtension(file.name)) : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <FilePlus2 className="size-4" />
          New document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New document</DialogTitle>
          <DialogDescription>
            Write in Markdown, upload a file, or save a link.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2">
          {MODES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setMode(option.value)}
              className={cn(
                "flex min-w-0 flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors hover:bg-accent",
                mode === option.value &&
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
            <div className="space-y-2">
              {file && fileKind ? (
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div
                    className={cn(
                      "shrink-0 rounded-md p-2",
                      KIND_META[fileKind].className,
                    )}
                  >
                    <DocumentKindIcon kind={fileKind} size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {KIND_META[fileKind].label} · {formatSize(file.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                    onClick={() => setFile(null)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    pickFile(e.dataTransfer.files?.[0]);
                  }}
                  className={cn(
                    "flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors hover:bg-accent/50",
                    dragging && "border-primary bg-accent",
                  )}
                >
                  <Upload className="size-6 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Drop a file here or click to browse
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {SUPPORTED_EXTENSIONS.map((e) => `.${e}`).join("  ")}
                  </span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_ATTRIBUTE}
                className="hidden"
                onChange={(e) => {
                  pickFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
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
            variant="secondary"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {mode === CreateDocumentMode.Write
              ? "Create & start writing"
              : mode === CreateDocumentMode.Upload
                ? "Upload"
                : "Save link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
