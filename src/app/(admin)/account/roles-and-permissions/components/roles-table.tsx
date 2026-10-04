"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Shield } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { useAdminUsersStore } from "@/store/client/mock/admin-users-store";
import { useLearnersStore } from "@/store/client/mock/learners-store";
import {
  LEARNER_ROLE_ID,
  useRolesStore,
  type Role,
} from "@/store/client/mock/roles-store";
import { RoleRowActions } from "./role-row-actions";
import { Button } from "@/components/ui/button";

export function RolesTable() {
  const roles = useRolesStore((state) => state.roles);
  const adminUsers = useAdminUsersStore((state) => state.users);
  const learners = useLearnersStore((state) => state.learners);
  const { hasPermission } = usePermission();
  const canCreate = hasPermission(PERMISSIONS.ROLES_CREATE);

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return roles.filter(
      (role) =>
        !query ||
        role.Name.toLowerCase().includes(query) ||
        role.Description.toLowerCase().includes(query),
    );
  }, [roles, search]);

  const maxPage = Math.max(0, Math.ceil(filtered.length / limit) - 1);
  const safePage = Math.min(page, maxPage);
  const rows = filtered.slice(safePage * limit, safePage * limit + limit);

  const columns = useMemo<ColumnDef<Role>[]>(
    () => [
      {
        accessorKey: "Name",
        header: "Roles",
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Shield className="size-4" />
            </span>
            <span className="truncate font-semibold">{row.original.Name}</span>
          </div>
        ),
      },
      {
        accessorKey: "IsSystem",
        header: "Type",
        cell: ({ row }) =>
          row.original.IsSystem ? (
            <Badge variant="secondary" className="font-normal">
              System Role
            </Badge>
          ) : (
            <Badge variant="outline" className="font-normal">
              Custom
            </Badge>
          ),
      },
      {
        id: "users",
        header: "Users",
        cell: ({ row }) => {
          const roleId = row.original.Id;
          const count =
            roleId === LEARNER_ROLE_ID
              ? learners.filter((user) => user.RoleId === roleId).length
              : adminUsers.filter((user) => user.RoleId === roleId).length;
          return <span className="tabular-nums font-medium">{count}</span>;
        },
      },
      {
        accessorKey: "Description",
        header: "Description",
        cell: ({ row }) => (
          <span className="block truncate text-muted-foreground">
            {row.original.Description || "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => <RoleRowActions role={row.original} />,
      },
    ],
    [adminUsers, learners],
  );

  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(role) => role.Id}
      title={`Roles (${filtered.length})`}
      search={search}
      onSearchChange={(value) => {
        setSearch(value);
        setPage(0);
      }}
      searchPlaceholder="Search roles…"
      page={safePage}
      limit={limit}
      total={filtered.length}
      onPageChange={setPage}
      onLimitChange={(value) => {
        setLimit(value);
        setPage(0);
      }}
      emptyTitle="No roles"
      emptyDescription="Create a role to start assigning permissions."
      emptyAction={
        canCreate ? (
          <Button asChild>
            <Link href="/account/roles-and-permissions/new">
              <Plus />
              New Role
            </Link>
          </Button>
        ) : undefined
      }
    />
  );
}
