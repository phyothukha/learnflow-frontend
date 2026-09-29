"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, FileWarning, Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MarkdownSplitEditor } from "@/components/markdown/markdown-split-editor";
import {
  MarkdownPreview,
  uniqueSlug,
} from "@/components/markdown/markdown-preview";
import { cn } from "@/lib/utils";
import { useUpdateDocument } from "@/store/server/documents/mutations";
import type { StudyDocument } from "@/store/server/documents/interface";

export { MarkdownPreview };

const MAX_CSV_ROWS = 1000;

export function toSnakeCaseFileName(name: string) {
  const trimmed = name.trim();
  const lastDot = trimmed.lastIndexOf(".");
  const hasExt = lastDot > 0 && lastDot < trimmed.length - 1;
  const base = hasExt ? trimmed.slice(0, lastDot) : trimmed;
  const ext = hasExt ? trimmed.slice(lastDot).toLowerCase() : "";
  const snake = base
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
  return `${snake || "download"}${ext}`;
}

export function downloadText(content: string, fileName: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = window.document.createElement("a");
  link.href = url;
  link.download = toSnakeCaseFileName(fileName);
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadFromUrl(url: string, fileName: string) {
  const link = window.document.createElement("a");
  link.href = url;
  link.download = toSnakeCaseFileName(fileName);
  link.target = "_blank";
  link.rel = "noopener";
  link.click();
}

export type OutlineHeading = { id: string; text: string; level: number };

export function extractHeadings(content: string): OutlineHeading[] {
  const seen = new Map<string, number>();
  const headings: OutlineHeading[] = [];
  let inFence = false;
  for (const line of content.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (inFence) continue;
    const match = /^(#{1,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;
    const text = match[2]
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[*_~`]/g, "")
      .trim();
    headings.push({
      id: uniqueSlug(text, seen),
      text,
      level: match[1].length,
    });
  }
  return headings;
}

export function DocumentOutline({
  headings,
  scrollRef,
  className,
}: {
  headings: OutlineHeading[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(
    headings[0]?.id ?? null,
  );

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const onScroll = () => {
      const top = container.getBoundingClientRect().top + 96;
      let current = headings[0]?.id ?? null;
      for (const heading of headings) {
        const el = window.document.getElementById(heading.id);
        if (el && el.getBoundingClientRect().top <= top) current = heading.id;
      }
      setActiveId(current);
    };
    onScroll();
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [headings, scrollRef]);

  return (
    <nav className={cn("flex min-h-0 flex-col", className)}>
      <p className="px-4 pt-5 pb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        On this page
      </p>
      {headings.length === 0 ? (
        <p className="px-4 text-xs text-muted-foreground">
          Add headings (#, ##, ###) to build an outline.
        </p>
      ) : (
        <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
          {headings.map((heading) => (
            <li key={heading.id}>
              <button
                type="button"
                onClick={() =>
                  window.document
                    .getElementById(heading.id)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                className={cn(
                  "w-full truncate rounded-md border-l-2 border-transparent py-1.5 pr-2 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                  activeId === heading.id &&
                    "border-primary bg-accent/60 font-medium text-foreground",
                )}
                style={{ paddingLeft: 10 + (heading.level - 1) * 12 }}
              >
                {heading.text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}

export function SourceView({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="overflow-x-auto font-mono text-[13px] leading-6">
      <table className="w-full table-fixed border-collapse">
        <tbody>
          {lines.map((line, i) => (
            <tr key={i} className="hover:bg-muted/50">
              <td className="w-12 border-r px-3 text-right align-top text-muted-foreground/60 select-none">
                {i + 1}
              </td>
              <td className="px-4 break-all whitespace-pre-wrap">
                {line || " "}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

export function CsvTable({ content }: { content: string }) {
  const rows = useMemo(() => parseCsv(content), [content]);
  const [header, ...body] = rows;
  const visibleRows = body.slice(0, MAX_CSV_ROWS);

  if (!header) return <EmptyContent message="This file is empty." />;

  return (
    <div className="max-h-[70vh] overflow-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-muted">
          <tr>
            <th className="w-12 border-b px-3 py-2 text-right text-xs font-normal text-muted-foreground">
              #
            </th>
            {header.map((cell, i) => (
              <th
                key={i}
                className="border-b border-l px-3 py-2 text-left font-medium whitespace-nowrap"
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row, r) => (
            <tr key={r} className="even:bg-muted/30 hover:bg-accent/60">
              <td className="border-b px-3 py-1.5 text-right text-xs text-muted-foreground">
                {r + 1}
              </td>
              {header.map((_, c) => (
                <td
                  key={c}
                  className="border-b border-l px-3 py-1.5 whitespace-nowrap"
                >
                  {row[c] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {body.length > MAX_CSV_ROWS && (
        <p className="border-t px-4 py-2 text-xs text-muted-foreground">
          Showing the first {MAX_CSV_ROWS} of {body.length} rows. Download the
          file to see everything.
        </p>
      )}
    </div>
  );
}

export function csvStats(content: string) {
  const rows = parseCsv(content);
  return { rows: Math.max(rows.length - 1, 0), columns: rows[0]?.length ?? 0 };
}

export function PdfFrame({ url }: { url: string }) {
  return (
    <iframe
      src={url}
      title="PDF preview"
      className="h-[calc(100svh-18rem)] min-h-[560px] w-full bg-muted"
    />
  );
}

export function OfficeFrame({ url, label }: { url: string; label: string }) {
  return (
    <iframe
      src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
      title={`${label} preview`}
      className="h-[calc(100svh-18rem)] min-h-[560px] w-full bg-muted"
    />
  );
}

export function LinkPanel({ url }: { url: string }) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
      <div className="rounded-2xl bg-muted p-4">
        <ExternalLink className="size-6 text-muted-foreground" />
      </div>
      <p className="max-w-lg text-sm break-all text-muted-foreground">{url}</p>
      <Button asChild>
        <a href={url} target="_blank" rel="noreferrer">
          <ExternalLink className="size-4" />
          Open link
        </a>
      </Button>
    </div>
  );
}

export function EmptyContent({
  message,
  action,
}: {
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
      <div className="rounded-2xl bg-muted p-4">
        <FileWarning className="size-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
      {action}
    </div>
  );
}

export function MarkdownEditorPanel({
  document,
  onDirtyChange,
  onClose,
  className,
}: {
  document: StudyDocument;
  onDirtyChange: (dirty: boolean) => void;
  onClose: () => void;
  className?: string;
}) {
  const [content, setContent] = useState(document.Content ?? "");
  const updateDocument = useUpdateDocument();
  const isDirty = content !== (document.Content ?? "");

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const save = (closeAfter: boolean) => {
    if (!isDirty) {
      if (closeAfter) onClose();
      return;
    }
    updateDocument.mutate(
      { id: document.Id, payload: { Content: content } },
      {
        onSuccess: () => {
          toast.success("Saved");
          onDirtyChange(false);
          if (closeAfter) onClose();
        },
        onError: () => toast.error("Failed to save"),
      },
    );
  };

  return (
    <div
      className={cn(
        "flex h-[calc(100svh-16rem)] min-h-[520px] flex-col",
        className,
      )}
    >
      <MarkdownSplitEditor
        value={content}
        onChange={setContent}
        onSave={() => save(false)}
        className="flex-1 rounded-none border-0 border-b"
      />
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className={cn(
              "size-2 rounded-full",
              updateDocument.isPending
                ? "animate-pulse bg-amber-500"
                : isDirty
                  ? "bg-amber-500"
                  : "bg-emerald-500",
            )}
          />
          {updateDocument.isPending
            ? "Saving…"
            : isDirty
              ? "Unsaved changes"
              : "All changes saved"}
        </span>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (isDirty && !window.confirm("Discard unsaved changes?"))
                return;
              onClose();
            }}
          >
            <X className="size-4" />
            Close
          </Button>
          <Button
            size="sm"
            onClick={() => save(true)}
            disabled={updateDocument.isPending}
          >
            {updateDocument.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
