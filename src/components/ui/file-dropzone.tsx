"use client";

import * as React from "react";
import { CloudUpload, FileIcon, X } from "lucide-react";

import { cn } from "@/lib/utils";

export interface FileDropzoneProps {
  id?: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  description?: React.ReactNode;
  className?: string;
  /** Selected files shown as removable pills. */
  files?: File[];
  onFiles?: (files: File[]) => void;
  onRemove?: (index: number) => void;
}

function FileDropzone({
  id,
  accept,
  multiple = false,
  disabled = false,
  description = "Maximum file size 50 MB.",
  className,
  files = [],
  onFiles,
  onRemove,
}: FileDropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const inputId = React.useId();
  const resolvedId = id ?? inputId;

  const handleFiles = (list: FileList | null) => {
    if (!list?.length || disabled) return;
    const next = multiple ? Array.from(list) : [list[0]];
    onFiles?.(next);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={resolvedId}
        onDragEnter={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-foreground/25 bg-background px-6 py-8 text-center transition-colors",
          "hover:border-foreground/40 hover:bg-muted/30",
          dragging && "border-primary bg-primary/5",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <div className="relative size-11 text-muted-foreground/60">
          <FileIcon className="size-11 stroke-[1.15]" aria-hidden />
          <span className="absolute -right-1.5 -bottom-1.5 flex size-6 items-center justify-center rounded-full bg-foreground text-background shadow-sm ring-2 ring-background">
            <CloudUpload className="size-3.5" aria-hidden />
          </span>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-foreground">
            <span className="font-medium underline underline-offset-2">
              Click to upload
            </span>{" "}
            <span className="text-muted-foreground">or drag and drop</span>
          </p>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>

        <input
          ref={inputRef}
          id={resolvedId}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>

      {files.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.size}-${file.lastModified}`}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              <span className="truncate">{file.name}</span>
              {onRemove ? (
                <button
                  type="button"
                  className="shrink-0 rounded-full opacity-80 transition-opacity hover:opacity-100"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => onRemove(index)}
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export { FileDropzone };
