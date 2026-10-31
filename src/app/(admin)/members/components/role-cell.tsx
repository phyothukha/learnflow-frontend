"use client";

import { useRolesStore } from "@/store/client/mock/roles-store";

export function RoleCell({ roleId }: { roleId: string }) {
  const name = useRolesStore(
    (state) => state.roles.find((role) => role.Id === roleId)?.Name,
  );
  return <span>{name ?? "—"}</span>;
}
