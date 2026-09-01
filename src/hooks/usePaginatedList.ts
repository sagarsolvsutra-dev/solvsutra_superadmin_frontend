"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import type { AxiosResponse } from "axios";
import type { ListParams } from "@/services/types";

// Matches the actual shape `fetchList` builds below (page/limit + optional
// search/extraParams, all string|number) and what every `*.service.ts`
// `list()` accepts — narrower than `Record<string, unknown>` so a service's
// `list` method (typed `params?: ListParams`) can be passed directly, per
// contravariance rules for function parameters.
type ListFn<T, S> = (params: ListParams) => Promise<
  AxiosResponse<{ items: T[]; total: number; pages: number; summary?: S }>
>;

type UseListOptions = {
  search?: string;
  page?: number;
  limit?: number;
  extraParams?: Record<string, string | undefined>;
};

/** Ported from the milk-dairy project's `usePaginatedList` — takes a service's
 * `list()` function directly instead of a raw endpoint string, since every
 * SolvSutra service already normalizes its response to `{items, total, pages}`
 * (see `services/normalize.ts`). */
export function usePaginatedList<T, S = Record<string, number>>(listFn: ListFn<T, S>, options: UseListOptions = {}) {
  const { search = "", page = 1, limit = 10, extraParams = {} } = options;
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [summary, setSummary] = useState<S | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const toast = useToast();

  const paramsKey = JSON.stringify(extraParams);
  // Guards against an older, slower request resolving after a newer one and
  // overwriting fresher state with stale results (e.g. rapid search typing
  // or fast page-clicking, where requests can resolve out of order).
  const requestIdRef = useRef(0);

  const fetchList = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string | number> = { page, limit };
      if (search) params.search = search;
      Object.entries(extraParams).forEach(([k, v]) => {
        if (v !== undefined && v !== "") params[k] = v;
      });
      const res = await listFn(params);
      if (requestId !== requestIdRef.current) return; // a newer request has since started — discard this one
      const data = res.data;
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
      setSummary(data.summary ?? null);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg, "Failed to load data");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listFn, search, page, limit, paramsKey]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  return { items, total, pages, summary, loading, error, refetch: fetchList };
}
