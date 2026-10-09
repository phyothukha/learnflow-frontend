/** OData-style list envelope returned by the enrollments and study-blocks endpoints. */
export interface ListResponse<T> {
  "@odata.count": number;
  value: T[];
}
