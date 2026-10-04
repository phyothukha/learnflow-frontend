"use client";

import { useMemo, useState } from "react";
import { UsersRound } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable } from "@/components/data-table";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { useTeamsStore } from "@/store/client/teams-store";
import type { Team } from "@/store/server/teams/interface";
import {
  createMemberColumns,
  notifyNotesAccess,
  type MemberRow,
} from "./member-columns";
import { AddMembersDialog } from "./add-members-dialog";

interface MembersTableProps {
  team: Team;
  canUpdate: boolean;
}

export function MembersTable({ team, canUpdate }: MembersTableProps) {
  const removeMember = useTeamsStore((state) => state.removeMember);
  const setMemberNotesAccess = useTeamsStore(
    (state) => state.setMemberNotesAccess,
  );
  const { confirmDelete, dialogProps } = useConfirmDialog();

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const rows = useMemo<MemberRow[]>(
    () =>
      team.Members.map((member) => ({
        ...member,
        TeamId: team.Id,
        TeamColor: team.Color,
      })),
    [team],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(
      (member) =>
        member.Name.toLowerCase().includes(query) ||
        member.Email.toLowerCase().includes(query),
    );
  }, [rows, search]);

  const maxPage = Math.max(0, Math.ceil(filtered.length / limit) - 1);
  const safePage = Math.min(page, maxPage);
  const pageRows = filtered.slice(safePage * limit, safePage * limit + limit);
  const hasQuery = !!search.trim();

  const columns = useMemo(
    () =>
      createMemberColumns({
        canUpdate,
        onToggleNotes: (teamId, learnerId, checked, name) => {
          setMemberNotesAccess(teamId, learnerId, checked);
          notifyNotesAccess(checked, name);
        },
        onRemove: (teamId, learnerId, name) => {
          void confirmDelete({
            title: "Remove member?",
            description: `Remove ${name} from ${team.Name}? They will lose access to this team's shared notes.`,
            confirmText: "Remove",
            successMessage: `${name} removed.`,
            onConfirm: () => removeMember(teamId, learnerId),
          });
        },
      }),
    [canUpdate, confirmDelete, removeMember, setMemberNotesAccess, team.Name],
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={pageRows}
        getRowId={(member) => member.LearnerId}
        title={`Members (${filtered.length})`}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(0);
        }}
        searchPlaceholder="Search by name or email"
        page={safePage}
        total={filtered.length}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(value) => {
          setLimit(value);
          setPage(0);
        }}
        emptyIcon={UsersRound}
        emptyTitle={hasQuery ? "No matching members" : "No learners yet"}
        emptyDescription={
          hasQuery
            ? "Try a different name or email."
            : "Add someone with their email to get started."
        }
        emptyAction={
          !hasQuery && canUpdate ? <AddMembersDialog team={team} /> : undefined
        }
      />
      <ConfirmDialog {...dialogProps} />
    </>
  );
}
