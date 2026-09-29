import type { StaticImageData } from "next/image";
import { FileText, Link2, type LucideIcon } from "lucide-react";

import csvIcon from "@/assets/icons/csv.png";
import mdIcon from "@/assets/icons/md.png";
import pdfIcon from "@/assets/icons/pdf.png";
import pptIcon from "@/assets/icons/ppt.png";
import wordIcon from "@/assets/icons/docx-file.png";

export enum DocumentKind {
  Markdown = "markdown",
  Csv = "csv",
  Pdf = "pdf",
  Word = "word",
  PowerPoint = "powerpoint",
  Link = "link",
  Other = "other",
}

/** Formats stored as text in `Document.Content`; everything else is uploaded. */
export const TEXT_EXTENSIONS = ["md", "csv"] as const;
export const BINARY_EXTENSIONS = ["pdf", "doc", "docx", "ppt", "pptx"] as const;
export const SUPPORTED_EXTENSIONS = [
  ...TEXT_EXTENSIONS,
  ...BINARY_EXTENSIONS,
] as const;
export const ACCEPT_ATTRIBUTE = SUPPORTED_EXTENSIONS.map((e) => `.${e}`).join(
  ",",
);

export const MAX_TEXT_BYTES = 2_000_000;
export const MAX_UPLOAD_BYTES = 25_000_000;

const KIND_BY_EXTENSION = new Map<string, DocumentKind>([
  ["md", DocumentKind.Markdown],
  ["markdown", DocumentKind.Markdown],
  ["csv", DocumentKind.Csv],
  ["pdf", DocumentKind.Pdf],
  ["doc", DocumentKind.Word],
  ["docx", DocumentKind.Word],
  ["ppt", DocumentKind.PowerPoint],
  ["pptx", DocumentKind.PowerPoint],
  ["link", DocumentKind.Link],
]);

export interface KindMeta {
  label: string;
  /** PNG file-type icon when available. */
  icon: StaticImageData | null;
  /** Lucide fallback when no PNG exists (link / other). */
  fallbackIcon: LucideIcon;
  className: string;
}

const OTHER_KIND_META: KindMeta = {
  label: "File",
  icon: null,
  fallbackIcon: FileText,
  className: "bg-muted text-muted-foreground",
};

export const KIND_META = new Map<DocumentKind, KindMeta>([
  [
    DocumentKind.Markdown,
    {
      label: "Markdown",
      icon: mdIcon,
      fallbackIcon: FileText,
      className: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
  ],
  [
    DocumentKind.Csv,
    {
      label: "CSV",
      icon: csvIcon,
      fallbackIcon: FileText,
      className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
  ],
  [
    DocumentKind.Pdf,
    {
      label: "PDF",
      icon: pdfIcon,
      fallbackIcon: FileText,
      className: "bg-red-500/10 text-red-600 dark:text-red-400",
    },
  ],
  [
    DocumentKind.Word,
    {
      label: "Word",
      icon: wordIcon,
      fallbackIcon: FileText,
      className: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    },
  ],
  [
    DocumentKind.PowerPoint,
    {
      label: "PowerPoint",
      icon: pptIcon,
      fallbackIcon: FileText,
      className: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    },
  ],
  [
    DocumentKind.Link,
    {
      label: "Link",
      icon: null,
      fallbackIcon: Link2,
      className: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
    },
  ],
  [DocumentKind.Other, OTHER_KIND_META],
]);

export function getKindMeta(kind: DocumentKind) {
  return KIND_META.get(kind) ?? OTHER_KIND_META;
}

export function getExtension(fileName: string) {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot + 1).toLowerCase();
}

export function stripExtension(fileName: string) {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? fileName : fileName.slice(0, dot);
}

export function isSupportedExtension(extension: string) {
  return (SUPPORTED_EXTENSIONS as readonly string[]).includes(extension);
}

export function isTextExtension(extension: string) {
  return (TEXT_EXTENSIONS as readonly string[]).includes(extension);
}

export function getDocumentKind(fileType: string | null | undefined) {
  return (
    KIND_BY_EXTENSION.get((fileType ?? "").toLowerCase()) ?? DocumentKind.Other
  );
}

/** Short badge text such as "MD", "DOCX" or "PDF". */
export function getExtensionLabel(fileType: string | null | undefined) {
  const type = (fileType ?? "").toLowerCase();
  if (type === "markdown") return "MD";
  return type ? type.toUpperCase() : "FILE";
}
