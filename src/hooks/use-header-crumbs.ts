import { accountNavItems, dashboardNavItems } from "@/assets/nav-links";
import {
  LearnerStatus,
  useLearnersStore,
} from "@/store/client/mock/learners-store";
import { useRolesStore } from "@/store/client/mock/roles-store";
import { useNotesStore } from "@/store/client/notes-store";
import { useTeamsStore } from "@/store/client/teams-store";
import { useFetchDocument } from "@/store/server/documents/queries";
import { useFetchTopic } from "@/store/server/topics/queries";

const ROUTE_LABELS = new Map<string, string>([
  ...dashboardNavItems().map(
    (item) => [item.href.replace(/^\//, ""), item.title] as const,
  ),
  ...accountNavItems().map(
    (item) => [item.href.replace(/^\//, ""), item.title] as const,
  ),
]);

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

  const accountRoleId =
    section === "account" &&
    parts[1] === "roles-and-permissions" &&
    parts[2] &&
    parts[2] !== "new"
      ? parts[2]
      : null;
  const accountRole = useRolesStore((state) =>
    accountRoleId
      ? state.roles.find((item) => item.Id === accountRoleId)
      : undefined,
  );

  if (section === "account") {
    const tab = parts[1];
    if (tab === "user-invitation") {
      return [
        { label: "Account", href: "/account/profile" },
        {
          label: "User Management",
          href: "/account/user-management",
        },
        { label: "Invite User" },
      ];
    }
    if (tab === "user-management" && parts[2]) {
      return [
        { label: "Account", href: "/account/profile" },
        {
          label: "User Management",
          href: "/account/user-management",
        },
        {
          label: parts[3] === "edit" ? "Edit User" : parts[2],
        },
      ];
    }
    if (tab === "roles-and-permissions") {
      const crumbs: HeaderCrumb[] = [
        { label: "Account", href: "/account/profile" },
        {
          label: "Roles & Permissions",
          href: parts[2] ? "/account/roles-and-permissions" : undefined,
        },
      ];
      if (parts[2] === "new") crumbs.push({ label: "New Role" });
      else if (parts[2])
        crumbs.push({ label: accountRole?.Name ?? "Edit Role" });
      return crumbs;
    }
    const tabLabel =
      ROUTE_LABELS.get(`account/${tab}`) ??
      (tab ? tab.charAt(0).toUpperCase() + tab.slice(1) : "Account");
    return [
      { label: "Account", href: tab ? "/account/profile" : undefined },
      ...(tab ? [{ label: tabLabel }] : []),
    ];
  }

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
