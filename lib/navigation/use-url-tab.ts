"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useUrlTab<T extends string>(
  validTabs: readonly T[],
  defaultTab: T,
  paramName = "tab",
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get(paramName);
  const activeTab: T =
    tabParam && validTabs.includes(tabParam as T) ? (tabParam as T) : defaultTab;

  const setTab = useCallback(
    (nextTab: T, mutateParams?: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextTab === defaultTab) {
        params.delete(paramName);
      } else {
        params.set(paramName, nextTab);
      }
      mutateParams?.(params);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [defaultTab, paramName, pathname, router, searchParams],
  );

  return { activeTab, setTab };
}
