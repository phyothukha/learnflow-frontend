"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { DataTable } from "@/components/data-table";
import {
  DataTableFacetedFilter,
  type FacetedFilterOption,
} from "@/components/data-table-faceted-filter";
import { LEARNER_STATUS_DOT } from "@/lib/learner-status";
import {
  LearnerStatus,
  useLearnersStore,
} from "@/store/client/mock/learners-store";
import { columns } from "./columns";
import { LearnersPrimaryButtons } from "./learners-primary-buttons";

const STATUS_OPTIONS: FacetedFilterOption<LearnerStatus>[] = Object.values(
  LearnerStatus,
).map((status) => ({
  value: status,
  label: status,
  dotClass: LEARNER_STATUS_DOT.get(status),
}));

export function LearnersTable() {
  const router = useRouter();
  const learners = useLearnersStore((state) => state.learners);

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState<LearnerStatus[]>([]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return learners.filter(
      (learner) =>
        (statuses.length === 0 || statuses.includes(learner.Status)) &&
        (!query ||
          learner.Name.toLowerCase().includes(query) ||
          learner.Email.toLowerCase().includes(query)),
    );
  }, [learners, search, statuses]);

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
      getRowId={(learner) => learner.Id}
      title={`Total Learners (${filtered.length})`}
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
      onRowClick={(learner) => router.push(`/learners/${learner.Id}`)}
      emptyIcon={GraduationCap}
      emptyTitle={hasQuery ? "No matching learners" : "No learners yet"}
      emptyDescription={
        hasQuery
          ? "Try a different name, email or status."
          : "Invite someone by email to get started."
      }
      emptyAction={!hasQuery ? <LearnersPrimaryButtons /> : undefined}
    />
  );
}
