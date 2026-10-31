"use client";

import { useEffect } from "react";
import { writeMemberAccessCookie } from "@/lib/member-access";
import { useMembersStore } from "@/store/client/mock/members-store";
import { useRolesStore } from "@/store/client/mock/roles-store";

/** Keeps a localhost cookie in sync so the member app can apply per-member tab access. */
export function useMemberAccessSync() {
  const members = useMembersStore((state) => state.members);
  const roles = useRolesStore((state) => state.roles);

  useEffect(() => {
    writeMemberAccessCookie(members, roles);
  }, [members, roles]);
}
