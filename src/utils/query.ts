export interface QueryOptions {
  page?: number; // 0-indexed
  limit?: number;
  filter?: string;
  expand?: string;
  select?: string;
  orderby?: string;
  count?: boolean;
}

export interface SortEntry {
  id: string;
  desc: boolean;
}

/**
 * Translates table sorting into an OData `$orderby` value.
 * `fields` maps a column id to its OData path when they differ.
 *
 * toOrderBy([{ id: "Course", desc: true }], new Map([["Course", "Course/Title"]]))
 * // => "Course/Title desc"
 */
export function toOrderBy(
  sorting: SortEntry[],
  fields?: Map<string, string>,
): string | undefined {
  if (!sorting.length) return undefined;
  return sorting
    .map(({ id, desc }) => `${fields?.get(id) ?? id} ${desc ? "desc" : "asc"}`)
    .join(",");
}

/**
 * Translates UI filter state into an OData-compatible query string.
 *
 * buildQuery({ page: 2, limit: 10, filter: "contains(tolower(Title), 'search')" })
 * // => "$top=10&$skip=20&$filter=...&$count=true"
 */
export function buildQuery({
  page,
  limit,
  filter,
  expand,
  select,
  orderby,
  count = true,
}: QueryOptions): string {
  const params = new URLSearchParams();

  if (limit !== undefined) {
    params.set("$top", String(limit));
    if (page !== undefined) params.set("$skip", String(page * limit));
  }
  if (filter) params.set("$filter", filter);
  if (expand) params.set("$expand", expand);
  if (select) params.set("$select", select);
  if (orderby) params.set("$orderby", orderby);
  if (count) params.set("$count", "true");

  return params.toString();
}
