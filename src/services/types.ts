export type ListParams = Record<string, string | number | boolean | undefined>;

/** The shape `usePaginatedList` expects every `list()` call to resolve to. */
export type NormalizedListResponse<T> = {
  data: {
    items: T[];
    total: number;
    pages: number;
  };
};
