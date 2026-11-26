import type { PagingParamsDto } from "@open-dpp/dto";

import type { ComputedRef, Ref } from "vue";
import { computed, ref } from "vue";

export type Cursor = string | null;

export interface Page {
  from: number;
  to: number;
  itemCount: number;
  cursor: Cursor;
}

export interface PagingResult {
  paging_metadata: { cursor: Cursor; total_count?: number };
  result: any[];
}

interface PaginationProps {
  initialCursor?: string;
  limit: number;
  fetchCallback: (pagingParams: PagingParamsDto) => Promise<PagingResult>;
  changeQueryParams: (params: Record<string, string | undefined>) => void;
}

export interface IPagination {
  resetCursor: () => Promise<void>;
  hasPrevious: ComputedRef<boolean>;
  hasNext: ComputedRef<boolean>;
  nextPage: () => Promise<Page>;
  previousPage: () => Promise<Page>;
  currentPage: Ref<Page>;
  reloadCurrentPage: () => Promise<void>;
  // Total number of items across all pages, or null when the endpoint does not report it.
  totalCount: Ref<number | null>;
}

export function usePagination({
  initialCursor,
  limit,
  fetchCallback,
  changeQueryParams,
}: PaginationProps): IPagination {
  const startCursor = ref<string | null>(initialCursor ?? null);
  const pages = ref<Page[]>([{ cursor: startCursor.value, from: 0, to: limit - 1, itemCount: 0 }]);
  const currentPageIndex = ref<number>(0);
  const totalCount = ref<number | null>(null);
  const currentPage = ref<Page>({
    cursor: startCursor.value,
    from: 0,
    to: limit - 1,
    itemCount: 0,
  });

  const hasPrevious = computed(() => {
    return currentPage.value.cursor !== startCursor.value;
  });

  const isLastPage = ref(false);

  const fetchPage = async (cursor: Cursor): Promise<PagingResult> => {
    const response = await fetchCallback({ cursor: cursor ?? undefined, limit });
    isLastPage.value = response.paging_metadata.cursor === null;
    totalCount.value = response.paging_metadata.total_count ?? null;
    return response;
  };

  const hasNext = computed(() => {
    if (isLastPage.value) return false;
    return currentPage.value.itemCount === currentPage.value.to - currentPage.value.from + 1;
  });

  const updateCurrentPage = async () => {
    currentPage.value = pages.value[currentPageIndex.value] ?? currentPage.value;
    const queryParams = { cursor: currentPage.value.cursor ?? undefined };
    changeQueryParams(queryParams);
  };

  const lastPage = (): Page => {
    return pages.value[pages.value.length - 1] ?? currentPage.value;
  };

  const findPageByCursor = (cursor: Cursor): Page | undefined => {
    return pages.value.find((page) => page.cursor === cursor);
  };

  const addPage = (cursor: Cursor) => {
    const fromIndex = lastPage().to + 1;
    pages.value.push({
      from: fromIndex,
      to: fromIndex + limit - 1,
      cursor,
      itemCount: 0,
    });
  };

  // The fetch callback of a list keeps the items of every answer. Two navigations that ran at
  // once could be answered in the other order, and the items of the first would end up under
  // the page of the second. So a navigation waits for the one that is still on its way, and
  // starts right away when there is none.
  let navigationOnItsWay: Promise<void> | undefined;
  const inTurn = <T>(navigate: () => Promise<T>): Promise<T> => {
    const navigation = navigationOnItsWay ? navigationOnItsWay.then(navigate) : navigate();
    const settle = () => {
      if (navigationOnItsWay === settled) {
        navigationOnItsWay = undefined;
      }
    };
    const settled: Promise<void> = navigation.then(settle, settle);
    navigationOnItsWay = settled;
    return navigation;
  };

  // The page at the given distance from the shown one, or the shown one when there is none
  const pageIndexAt = (distance: number): number => {
    const pageIndex = currentPageIndex.value + distance;
    return pages.value[pageIndex] ? pageIndex : currentPageIndex.value;
  };

  // The index moves only once the page was fetched: after a failed request the shown page is
  // still the one a navigation starts from.
  const showNextPage = async (): Promise<Page> => {
    const nextPageIndex = pageIndexAt(1);
    const nextPage = pages.value[nextPageIndex]!;

    const response = await fetchPage(nextPage.cursor);
    nextPage.itemCount = response.result.length;
    const nextCursor = response.paging_metadata.cursor;
    if (nextCursor !== null && !findPageByCursor(nextCursor)) {
      addPage(nextCursor);
    }
    currentPageIndex.value = nextPageIndex;
    await updateCurrentPage();

    return nextPage;
  };

  const showPreviousPage = async (): Promise<Page> => {
    const previousPageIndex = pageIndexAt(-1);
    const previousPage = pages.value[previousPageIndex] ?? currentPage.value;
    await fetchPage(previousPage.cursor);
    currentPageIndex.value = previousPageIndex;
    await updateCurrentPage();
    return previousPage;
  };

  const reloadPage = async (page: Page) => {
    const response = await fetchPage(page.cursor);
    page.itemCount = response.result.length;
    const pageIndex = pages.value.findIndex((p) => p === page);
    if (pageIndex === -1) {
      return;
    }
    // The items behind the page may have moved since the pages after it were found: their
    // cursors and positions are stale. They are dropped and found again from this page on.
    pages.value = pages.value.slice(0, pageIndex + 1);
    if (response.paging_metadata.cursor !== null) {
      addPage(response.paging_metadata.cursor);
    }
  };

  const showFirstPage = async () => {
    startCursor.value = null;
    pages.value = [{ cursor: startCursor.value, from: 0, to: limit - 1, itemCount: 0 }];
    currentPageIndex.value = 0;
    await updateCurrentPage();
    await showNextPage();
    changeQueryParams({ cursor: undefined });
  };

  return {
    resetCursor: () => inTurn(showFirstPage),
    hasPrevious,
    hasNext,
    nextPage: () => inTurn(showNextPage),
    previousPage: () => inTurn(showPreviousPage),
    currentPage,
    reloadCurrentPage: () => inTurn(() => reloadPage(currentPage.value)),
    totalCount,
  };
}
