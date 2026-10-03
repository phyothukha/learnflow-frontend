import { navLinks } from "@/assets/nav-links";
import {
  LearnerStatus,
  useLearnersStore,
} from "@/store/client/mock/learners-store";
import { useNotesStore } from "@/store/client/notes-store";
import { useTeamsStore } from "@/store/client/teams-store";
import { useFetchDocument } from "@/store/server/documents/queries";
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
  const teamId = section === "teams" && parts[1] ? parts[1] : null;
  const learnerId =
    section === "learners" &&
    parts[1] &&
    parts[1] !== "invite" &&
    parts[1] !== "new"
      ? parts[1]
      : null;

  const { data: topic } = useFetchTopic(topicId);
  const { data: document } = useFetchDocument(documentId);
  const note = useNotesStore((state) =>
    noteId ? state.notes.find((item) => item.Id === noteId) : undefined,
  );
  const team = useTeamsStore((state) =>
    teamId ? state.teams.find((item) => item.Id === teamId) : undefined,
  );
  const learner = useLearnersStore((state) =>
    learnerId
      ? state.learners.find((item) => item.Id === learnerId)
      : undefined,
  );

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

  if (teamId) {
    crumbs.push({ label: team?.Name ?? "Team" });
  }

  if (section === "notes" && parts[1] === "new") {
    crumbs.push({ label: "New note" });
  } else if (noteId) {
    crumbs.push({ label: note?.Title ?? "Note" });
  }

  if (section === "learners" && parts[1] === "invite") {
    crumbs.push({ label: "Invite" });
  } else if (learnerId) {
    const label =
      learner?.Status === LearnerStatus.Invited
        ? (learner.Email ?? "Learner")
        : (learner?.Name ?? "Learner");
    crumbs.push({
      label,
      href: parts[2] ? `/learners/${learnerId}` : undefined,
    });
    if (parts[2] === "edit") {
      crumbs.push({ label: "Edit" });
    }
  }

  return crumbs;
}
