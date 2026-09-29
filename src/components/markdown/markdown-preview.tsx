"use client";

import { useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { MARKDOWN_PROSE } from "@/components/markdown/markdown-prose";

interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

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

function hastText(node: HastNode): string {
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(hastText).join("");
}

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

interface CodeBlockProps {
  children?: React.ReactNode;
}

function CodeBlock({ children }: CodeBlockProps) {
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

export interface MarkdownPreviewProps {
  content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <MarkdownRenderer
      content={content}
      className={MARKDOWN_PROSE}
      rehypePlugins={[rehypeHeadingIds]}
      components={{ pre: CodeBlock }}
    />
  );
}

export { uniqueSlug, slugify };
