"use client";

import { useRef, useState } from "react";
import {
  Bold,
  Code,
  Columns2,
  Eye,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  PenLine,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MarkdownPreview } from "@/components/markdown-preview";

enum ViewMode {
  Write = "write",
  Split = "split",
  Preview = "preview",
}

interface Format {
  icon: typeof Bold;
  label: string;
  prefix: string;
  suffix?: string;
  placeholder: string;
  block?: boolean;
}

interface ViewModeOption {
  value: ViewMode;
  label: string;
  icon: typeof Eye;
}

const FORMATS: Format[] = [
  {
    icon: Heading2,
    label: "Heading",
    prefix: "## ",
    placeholder: "Heading",
    block: true,
  },
  {
    icon: Bold,
    label: "Bold",
    prefix: "**",
    suffix: "**",
    placeholder: "bold text",
  },
  {
    icon: Italic,
    label: "Italic",
    prefix: "_",
    suffix: "_",
    placeholder: "italic text",
  },
  { icon: Code, label: "Code", prefix: "`", suffix: "`", placeholder: "code" },
  {
    icon: Link2,
    label: "Link",
    prefix: "[",
    suffix: "](https://)",
    placeholder: "link text",
  },
  {
    icon: List,
    label: "Bulleted list",
    prefix: "- ",
    placeholder: "List item",
    block: true,
  },
  {
    icon: ListOrdered,
    label: "Numbered list",
    prefix: "1. ",
    placeholder: "List item",
    block: true,
  },
  {
    icon: Quote,
    label: "Quote",
    prefix: "> ",
    placeholder: "Quote",
    block: true,
  },
];

const VIEW_MODES: ViewModeOption[] = [
  { value: ViewMode.Write, label: "Write", icon: PenLine },
  { value: ViewMode.Split, label: "Split", icon: Columns2 },
  { value: ViewMode.Preview, label: "Preview", icon: Eye },
];

const LIST_ITEM = /^(\s*)([-*+>]|\d+[.)])(\s+)(\[[ xX]\]\s+)?/;

interface ListContinuation {
  next: string;
  caret: number;
}

/** Continues a list / quote on Enter, or ends it when the current item is empty. */
function continueList(
  value: string,
  start: number,
  end: number,
): ListContinuation | null {
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const line = value.slice(lineStart, start);
  const match = LIST_ITEM.exec(line);
  if (!match) return null;

  const [marker, indent, bullet, gap, task] = match;
  const lineEnd = value.indexOf("\n", end);
  const rest = value.slice(end, lineEnd === -1 ? undefined : lineEnd);

  if (!line.slice(marker.length).trim() && !rest.trim()) {
    return {
      next: value.slice(0, lineStart) + value.slice(end),
      caret: lineStart,
    };
  }

  const number = /^\d+/.exec(bullet)?.[0];
  const nextBullet = number
    ? `${Number(number) + 1}${bullet.slice(number.length)}`
    : bullet;
  const insert = `\n${indent}${nextBullet}${gap}${task ? "[ ] " : ""}`;
  return {
    next: value.slice(0, start) + insert + value.slice(end),
    caret: start + insert.length,
  };
}

export interface MarkdownSplitEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  className?: string;
}

export function MarkdownSplitEditor({
  value,
  onChange,
  onSave,
  className,
}: MarkdownSplitEditorProps) {
  const [mode, setMode] = useState<ViewMode>(ViewMode.Split);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  const applyFormat = (format: Format) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart: start, selectionEnd: end } = textarea;
    const selected = value.slice(start, end) || format.placeholder;
    const needsNewline = format.block && start > 0 && value[start - 1] !== "\n";
    const prefix = `${needsNewline ? "\n" : ""}${format.prefix}`;
    const suffix = format.suffix ?? "";
    const next =
      value.slice(0, start) + prefix + selected + suffix + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selected.length,
      );
    });
  };

  // Keep the preview roughly aligned with the editor while scrolling.
  const syncScroll = () => {
    const textarea = textareaRef.current;
    const preview = previewRef.current;
    if (!textarea || !preview || mode !== ViewMode.Split) return;
    const maxScroll = textarea.scrollHeight - textarea.clientHeight;
    const ratio = maxScroll > 0 ? textarea.scrollTop / maxScroll : 0;
    preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight);
  };

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-lg border bg-card",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-2 py-1.5">
        <div className="flex flex-wrap items-center gap-0.5">
          {FORMATS.map((format) => (
            <Button
              key={format.label}
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground"
              title={format.label}
              disabled={mode === ViewMode.Preview}
              onClick={() => applyFormat(format)}
            >
              <format.icon className="size-3.5" />
            </Button>
          ))}
        </div>
        <div className="flex items-center rounded-md border bg-background p-0.5">
          {VIEW_MODES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setMode(option.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
                mode === option.value && "bg-accent text-foreground shadow-xs",
                option.value === ViewMode.Split && "hidden md:inline-flex",
              )}
            >
              <option.icon className="size-3.5" />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className={cn(
          "grid min-h-0 flex-1",
          mode === ViewMode.Split && "md:grid-cols-2 md:divide-x",
        )}
      >
        {mode !== ViewMode.Preview && (
          <div className="flex min-h-0 flex-col">
            <div className="border-b px-4 py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Markdown
            </div>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onScroll={syncScroll}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "s") {
                  e.preventDefault();
                  onSave?.();
                  return;
                }
                if (
                  e.key !== "Enter" ||
                  e.shiftKey ||
                  e.metaKey ||
                  e.ctrlKey ||
                  e.altKey ||
                  e.nativeEvent.isComposing
                )
                  return;
                const textarea = e.currentTarget;
                const result = continueList(
                  value,
                  textarea.selectionStart,
                  textarea.selectionEnd,
                );
                if (!result) return;
                e.preventDefault();
                onChange(result.next);
                requestAnimationFrame(() =>
                  textarea.setSelectionRange(result.caret, result.caret),
                );
              }}
              placeholder={
                "# Start writing\n\nUse **Markdown** to format your document…"
              }
              spellCheck
              className="min-h-0 flex-1 resize-none bg-transparent px-4 py-3 font-mono text-sm leading-relaxed outline-none placeholder:text-muted-foreground/60"
            />
          </div>
        )}
        {mode !== ViewMode.Write && (
          <div
            className={cn(
              "flex min-h-0 flex-col",
              mode === ViewMode.Split && "hidden md:flex",
            )}
          >
            <div className="border-b px-4 py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Preview
            </div>
            <div
              ref={previewRef}
              className="min-h-0 flex-1 overflow-y-auto px-5 py-4"
            >
              {value.trim() ? (
                <MarkdownPreview content={value} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nothing to preview yet.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t px-4 py-1.5 text-[11px] text-muted-foreground">
        <span>Markdown supported · GitHub flavored</span>
        <span>
          {wordCount} {wordCount === 1 ? "word" : "words"}
          {onSave && " · ⌘S to save"}
        </span>
      </div>
    </div>
  );
}
