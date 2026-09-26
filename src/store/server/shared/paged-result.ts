export interface PagedResult<T> {
  Items: T[];
  Page: number;
  PageSize: number;
  TotalCount: number;
}
