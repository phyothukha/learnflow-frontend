"use client";

import { useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { uniqueSlug } from "@/utils/string";

interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
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
  className?: string;
}

export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  return (
    <MarkdownRenderer
      content={content}
      className={className ? `markdown-prose ${className}` : "markdown-prose"}
      rehypePlugins={[rehypeHeadingIds]}
      components={{ pre: CodeBlock }}
    />
  );
}
