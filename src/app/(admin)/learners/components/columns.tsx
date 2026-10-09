"use client";

import { type ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { formatRelative } from "@/utils/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LEARNER_STATUS_VARIANT } from "@/lib/learner-status";
import {
  LearnerStatus,
  type Learner,
} from "@/store/client/mock/learners-store";
import { taskPercent } from "@/utils/learner";
import { getInitials } from "@/utils/string";
import { DataTableRowActions } from "./data-table-row-actions";
import { PortalAccessCell } from "./portal-access-cell";
import { RoleCell } from "./role-cell";
import { TeamsCell } from "./teams-cell";

export const columns: ColumnDef<Learner>[] = [
  {
    accessorKey: "Email",
    header: "Learner",
    cell: ({ row }) => {
      const { Name, Email, Status } = row.original;
      const invited = Status === LearnerStatus.Invited;
      return (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-8 shrink-0">
            <AvatarFallback>
              {getInitials(invited ? Email : Name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium">{invited ? Email : Name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {invited ? "Invite pending" : Email}
            </p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "RoleId",
    header: "Role",
    enableSorting: false,
    cell: ({ row }) => <RoleCell roleId={row.original.RoleId} />,
  },
  {
    id: "PortalAccess",
    header: "Portal access",
    enableSorting: false,
    cell: ({ row }) => <PortalAccessCell learner={row.original} />,
  },
  {
    accessorKey: "Status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant={
          LEARNER_STATUS_VARIANT.get(row.original.Status) ?? "status-slate"
        }
      >
        {row.original.Status}
      </Badge>
    ),
  },
  {
    id: "Teams",
    header: "Teams",
    enableSorting: false,
    cell: ({ row }) => <TeamsCell learnerId={row.original.Id} />,
  },
  {
    id: "Enrollments",
    header: "Courses",
    accessorFn: (learner) => learner.Enrollments.length,
    cell: ({ row }) => row.original.Enrollments.length,
  },
  {
    id: "TaskProgress",
    header: "Task progress",
    accessorFn: taskPercent,
    cell: ({ row }) => {
      const value = taskPercent(row.original);
      return (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${value}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{value}%</span>
        </div>
      );
    },
  },
  {
    accessorKey: "LastLoginAt",
    header: "Last active",
    cell: ({ row }) =>
      row.original.LastLoginAt ? (
        <span
          title={dayjs(row.original.LastLoginAt).format("DD MMM YYYY HH:mm")}
        >
          {formatRelative(row.original.LastLoginAt)}
        </span>
      ) : (
        <span className="text-muted-foreground">Never</span>
      ),
  },
  {
    id: "actions",
    enableSorting: false,
    header: "Actions",
    cell: ({ row }) => <DataTableRowActions learner={row.original} />,
  },
];
