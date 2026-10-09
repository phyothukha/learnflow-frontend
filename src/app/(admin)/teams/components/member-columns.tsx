"use client";

import { type ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { UserMinus } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { TeamMember } from "@/store/server/teams/interface";
import { getInitials } from "@/utils/string";

export interface MemberRow extends TeamMember {
  TeamId: string;
  TeamColor: string;
}

interface MemberColumnsOptions {
  canUpdate: boolean;
  onToggleNotes: (
    teamId: string,
    learnerId: string,
    canAccessNotes: boolean,
    name: string,
  ) => void;
  onRemove: (teamId: string, learnerId: string, name: string) => void;
}

export function createMemberColumns({
  canUpdate,
  onToggleNotes,
  onRemove,
}: MemberColumnsOptions): ColumnDef<MemberRow>[] {
  return [
    {
      accessorKey: "Name",
      header: "Member",
      cell: ({ row }) => {
        const member = row.original;
        return (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-8 shrink-0">
              <AvatarFallback
                className="text-xs font-semibold text-white"
                style={{ backgroundColor: member.TeamColor }}
              >
                {getInitials(member.Name || member.Email)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-medium">{member.Name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {member.Email}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "JoinedAt",
      header: "Joined",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {dayjs(row.original.JoinedAt).format("DD MMM YYYY")}
        </span>
      ),
    },
    {
      id: "NotesAccess",
      header: "Notes access",
      enableSorting: false,
      cell: ({ row }) => {
        const member = row.original;
        if (!canUpdate) {
          return (
            <Badge variant={member.CanAccessNotes ? "status-green" : "outline"}>
              {member.CanAccessNotes ? "Allowed" : "Blocked"}
            </Badge>
          );
        }
        return (
          <label
            className="inline-flex items-center gap-2 text-xs font-medium"
            onClick={(event) => event.stopPropagation()}
          >
            <Switch
              checked={member.CanAccessNotes}
              onCheckedChange={(checked) =>
                onToggleNotes(
                  member.TeamId,
                  member.LearnerId,
                  checked,
                  member.Name,
                )
              }
            />
            {member.CanAccessNotes ? "On" : "Off"}
          </label>
        );
      },
    },
    {
      id: "actions",
      enableSorting: false,
      cell: ({ row }) => {
        if (!canUpdate) return null;
        const member = row.original;
        return (
          <div onClick={(event) => event.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Remove ${member.Name}`}
              onClick={() =>
                onRemove(member.TeamId, member.LearnerId, member.Name)
              }
            >
              <UserMinus />
              Remove member
            </Button>
          </div>
        );
      },
    },
  ];
}

export function notifyNotesAccess(checked: boolean, name: string) {
  toast.success(
    checked
      ? `${name} can access team notes.`
      : `${name} no longer has notes access.`,
  );
}
