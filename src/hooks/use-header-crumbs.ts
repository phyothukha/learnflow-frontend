import { navLinks } from "@/assets/nav-links";
import { useFetchDocument } from "@/store/server/documents/queries";
import { useFetchNote } from "@/store/server/notes/queries";
import { useFetchTopic } from "@/store/server/topics/queries";

const ROUTE_LABELS = new Map<string, string>(
  navLinks.flatMap((group) =>
    group.items.map((item) => [item.href.replace(/^\//, ""), item.title]),
  ),
);

export interface HeaderCrumb {
  label: string;
  href?: string;
}

export function useHeaderCrumbs(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const section = parts[0] ?? "dashboard";
  const sectionLabel =
    ROUTE_LABELS.get(section) ??
    section.charAt(0).toUpperCase() + section.slice(1);

  const topicId = section === "library" && parts[1] ? parts[1] : null;
  const documentId = section === "library" && parts[2] ? parts[2] : null;
  const noteId =
    section === "notes" && parts[1] && parts[1] !== "new" ? parts[1] : null;

  const { data: topic } = useFetchTopic(topicId);
  const { data: document } = useFetchDocument(documentId);
  const { data: note } = useFetchNote(noteId);

  const crumbs: HeaderCrumb[] = [
    {
      label: "Dashboard",
      href: section === "dashboard" ? undefined : "/dashboard",
    },
  ];

  if (section !== "dashboard") {
    crumbs.push({
      label: sectionLabel,
      href: parts.length > 1 ? `/${section}` : undefined,
    });
  }

  if (topicId) {
    crumbs.push({
      label: topic?.Title ?? "Topic",
      href: documentId ? `/library/${topicId}` : undefined,
    });
  }

  if (documentId) {
    crumbs.push({ label: document?.Title ?? "Document" });
  }

  if (section === "notes" && parts[1] === "new") {
    crumbs.push({ label: "New note" });
  } else if (noteId) {
    crumbs.push({ label: note?.Title ?? "Note" });
  }

  return crumbs;
}
