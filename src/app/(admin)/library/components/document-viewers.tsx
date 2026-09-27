"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  FileWarning,
  Loader2,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { MarkdownSplitEditor } from "@/components/markdown/markdown-split-editor";
import { cn } from "@/lib/utils";
import { useUpdateDocument } from "@/store/server/documents/mutations";
import type { StudyDocument } from "@/store/server/documents/interface";

const MAX_CSV_ROWS = 1000;

export function downloadText(content: string, fileName: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = window.document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

/** Long-form reading styles layered on top of the base renderer. */
const DOCUMENT_PROSE = cn(
  "mx-auto max-w-4xl min-w-0 text-[15px] leading-7 break-words text-foreground/90 [overflow-wrap:anywhere]",
  "[&_h1]:scroll-mt-4 [&_h2]:scroll-mt-4 [&_h3]:scroll-mt-4 [&_h1]:mt-0 [&_h1]:mb-5 [&_h1]:border-b [&_h1]:pb-3 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-foreground",
  "[&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground",
  "[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground",
  "[&_p]:mb-4 [&_li]:mb-1.5 [&_li::marker]:text-muted-foreground",
  "[&_strong]:font-semibold [&_strong]:text-foreground",
  "[&_blockquote]:my-5 [&_blockquote]:rounded-r-lg [&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:bg-muted/50 [&_blockquote]:py-2 [&_blockquote]:pr-4 [&_blockquote]:pl-4 [&_blockquote]:italic",
  "[&_pre]:my-5 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:bg-muted/60 [&_pre]:p-4 [&_pre]:text-[13px] [&_pre]:leading-6 [&_pre]:[overflow-wrap:normal]",
  "[&_:not(pre)>code]:rounded-md [&_:not(pre)>code]:border [&_:not(pre)>code]:bg-muted/60 [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:text-[13px]",
  "[&_table]:my-5 [&_table]:block [&_table]:w-max [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:rounded-lg [&_td]:[overflow-wrap:normal] [&_table]:text-sm [&_th]:bg-muted/60 [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold [&_td]:px-3 [&_td]:py-2",
  "[&_img]:my-5 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-xl [&_img]:border",
  "[&_hr]:my-8 [&_a]:font-medium",
);

export type OutlineHeading = { id: string; text: string; level: number };

function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{M}\p{N}\s-]/gu, "")
      .replace(/\s+/g, "-") || "section"
  );
}

function uniqueSlug(text: string, seen: Map<string, number>) {
  const base = slugify(text);
  const count = seen.get(base) ?? 0;
  seen.set(base, count + 1);
  return count ? `${base}-${count}` : base;
}

type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

function hastText(node: HastNode): string {
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(hastText).join("");
}

// Ids are assigned on the parsed tree (not during React render) so they stay
// stable under StrictMode double rendering and match extractHeadings().
function rehypeHeadingIds() {
  return (tree: HastNode) => {
    const seen = new Map<string, number>();
    const walk = (node: HastNode) => {
      if (node.type === "element" && /^h[1-3]$/.test(node.tagName ?? "")) {
        node.properties = {
          ...node.properties,
          id: uniqueSlug(hastText(node).trim(), seen),
        };
      }
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}

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

function CodeBlock({ children }: { children?: React.ReactNode }) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  return (
    <div className="group/code relative">
      <pre ref={ref}>{children}</pre>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(ref.current?.innerText ?? "");
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-md border bg-background/90 px-2 py-1 text-[11px] font-medium text-muted-foreground opacity-0 shadow-xs transition-opacity group-hover/code:opacity-100 hover:text-foreground focus-visible:opacity-100"
      >
        {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export function MarkdownPreview({ content }: { content: string }) {
  return (
    <MarkdownRenderer
      content={content}
      className={DOCUMENT_PROSE}
      rehypePlugins={[rehypeHeadingIds]}
      components={{ pre: CodeBlock }}
    />
  );
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
            variant="outline"
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
