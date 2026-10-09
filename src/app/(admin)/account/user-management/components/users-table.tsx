"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { UserPlus, Users } from "lucide-react";
import { DataTable } from "@/components/data-table";
import {
  DataTableFacetedFilter,
  type FacetedFilterOption,
} from "@/components/data-table-faceted-filter";
import { Badge } from "@/components/ui/badge";
import {
  ADMIN_USER_STATUS_DOT,
  ADMIN_USER_STATUS_LABEL,
  ADMIN_USER_STATUS_VARIANT,
} from "@/lib/admin-user-status";
import {
  AdminUserStatus,
  useAdminUsersStore,
  type AdminUser,
} from "@/store/client/mock/admin-users-store";
import {
  LEARNER_ROLE_ID,
  useRolesStore,
} from "@/store/client/mock/roles-store";
import { UserRowActions } from "./user-row-actions";
import { Button } from "@/components/ui/button";

const STATUS_OPTIONS: FacetedFilterOption<AdminUserStatus>[] = [
  {
    value: AdminUserStatus.Active,
    label: "Active",
    dotClass: ADMIN_USER_STATUS_DOT.get(AdminUserStatus.Active),
  },
  {
    value: AdminUserStatus.Invited,
    label: "Invited",
    dotClass: ADMIN_USER_STATUS_DOT.get(AdminUserStatus.Invited),
  },
  {
    value: AdminUserStatus.Disabled,
    label: "Suspended",
    dotClass: ADMIN_USER_STATUS_DOT.get(AdminUserStatus.Disabled),
  },
];

export function UsersTable() {
  const users = useAdminUsersStore((state) => state.users);
  const roles = useRolesStore((state) => state.roles);
  const staffRoles = useMemo(
    () => roles.filter((role) => role.Id !== LEARNER_ROLE_ID),
    [roles],
  );

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState<AdminUserStatus[]>([]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter(
      (user) =>
        (statuses.length === 0 || statuses.includes(user.Status)) &&
        (!query ||
          user.Name.toLowerCase().includes(query) ||
          user.Email.toLowerCase().includes(query)),
    );
  }, [users, search, statuses]);

  const maxPage = Math.max(0, Math.ceil(filtered.length / limit) - 1);
  const safePage = Math.min(page, maxPage);
  const rows = filtered.slice(safePage * limit, safePage * limit + limit);

  const isFiltered = statuses.length > 0;
  const hasQuery = isFiltered || !!search;

  const withPageReset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(0);
    };

  const columns = useMemo<ColumnDef<AdminUser>[]>(
    () => [
      {
        accessorKey: "Name",
        header: "Username",
        cell: ({ row }) => {
          const invited = row.original.Status === AdminUserStatus.Invited;
          return (
            <div className="min-w-0">
              <p className="truncate font-semibold">
                {invited ? row.original.Email : row.original.Name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {invited ? "Invite pending" : row.original.Email}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "RoleId",
        header: "Role",
        cell: ({ row }) => (
          <span className="block truncate font-medium">
            {staffRoles.find((role) => role.Id === row.original.RoleId)?.Name ??
              "—"}
          </span>
        ),
      },
      {
        accessorKey: "Status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant={
              ADMIN_USER_STATUS_VARIANT.get(row.original.Status) ??
              "status-slate"
            }
          >
            {ADMIN_USER_STATUS_LABEL.get(row.original.Status) ??
              row.original.Status}
          </Badge>
        ),
      },
      {
        accessorKey: "JoinedAt",
        header: "Joined",
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums">
            {dayjs(row.original.JoinedAt).format("MMM D, YYYY")}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => <UserRowActions user={row.original} />,
      },
    ],
    [staffRoles],
  );

  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(user) => user.Id}
      title={`Total Users (${filtered.length})`}
      search={search}
      onSearchChange={withPageReset(setSearch)}
      searchPlaceholder="Search by name or email"
      filters={
        <DataTableFacetedFilter
          title="Status"
          options={STATUS_OPTIONS}
          selected={statuses}
          onChange={withPageReset(setStatuses)}
        />
      }
      onResetFilters={
        isFiltered
          ? () => {
              setStatuses([]);
              setPage(0);
            }
          : undefined
      }
      page={safePage}
      limit={limit}
      total={filtered.length}
      onPageChange={setPage}
      onLimitChange={withPageReset(setLimit)}
      emptyIcon={Users}
      emptyTitle={hasQuery ? "No matching users" : "No admin users"}
      emptyDescription={
        hasQuery
          ? "Try a different name, email or status."
          : "Invite a staff user to manage the workspace."
      }
      emptyAction={
        !hasQuery ? (
          <Button asChild>
            <Link href="/account/user-invitation">
              <UserPlus />
              Invite user
            </Link>
          </Button>
        ) : undefined
      }
    />
  );
}
