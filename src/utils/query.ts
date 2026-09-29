export interface QueryOptions {
  page?: number; // 0-indexed
  limit?: number;
  filter?: string;
  expand?: string;
  select?: string;
  orderby?: string;
  count?: boolean;
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
