"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { DataTable } from "@/components/data-table";
import {
  DataTableFacetedFilter,
  type FacetedFilterOption,
} from "@/components/data-table-faceted-filter";
import { MEMBER_STATUS_DOT } from "@/lib/member-status";
import {
  MemberStatus,
  useMembersStore,
} from "@/store/client/mock/members-store";
import { columns } from "./columns";
import { MembersPrimaryButtons } from "./members-primary-buttons";

const STATUS_OPTIONS: FacetedFilterOption<MemberStatus>[] = Object.values(
  MemberStatus,
).map((status) => ({
  value: status,
  label: status,
  dotClass: MEMBER_STATUS_DOT.get(status),
}));

export function MembersTable() {
  const router = useRouter();
  const members = useMembersStore((state) => state.members);

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState<MemberStatus[]>([]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return members.filter(
      (member) =>
        (statuses.length === 0 || statuses.includes(member.Status)) &&
        (!query ||
          member.Name.toLowerCase().includes(query) ||
          member.Email.toLowerCase().includes(query)),
    );
  }, [members, search, statuses]);

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

  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(member) => member.Id}
      title={`Total Members (${filtered.length})`}
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
      total={filtered.length}
      limit={limit}
      onPageChange={setPage}
      onLimitChange={withPageReset(setLimit)}
      onRowClick={(member) => router.push(`/members/${member.Id}`)}
      emptyIcon={GraduationCap}
      emptyTitle={hasQuery ? "No matching members" : "No members yet"}
      emptyDescription={
        hasQuery
          ? "Try a different name, email or status."
          : "Invite someone by email to get started."
      }
      emptyAction={!hasQuery ? <MembersPrimaryButtons /> : undefined}
    />
  );
}
