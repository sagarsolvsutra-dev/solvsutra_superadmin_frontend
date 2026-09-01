import type { AxiosResponse } from "axios";

/**
 * The backend's list endpoints don't share one response envelope — e.g.
 * `GET /clients` replies `{success, clients, total, page, pages}` while
 * `GET /plans` replies `{success, plans, total}` (no `page`/`pages`). This
 * reshapes any of them into `{data: {items, total, pages}}`, which is the
 * one shape `usePaginatedList` (ported from the milk-dairy project) expects
 * — so the hook itself never needs to know about per-resource key names.
 */
export function normalizeList<T>(resourceKey: string) {
  return (res: AxiosResponse<Record<string, unknown>>): AxiosResponse<{ items: T[]; total: number; pages: number }> => {
    const body = res.data;
    const items = (body[resourceKey] as T[]) ?? [];
    const total = (body.total as number) ?? items.length;
    const pages = (body.pages as number) ?? 1;
    return { ...res, data: { items, total, pages } };
  };
}
