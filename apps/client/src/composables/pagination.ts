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
  paging_metadata: { cursor: Cursor };
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
}

export function usePagination({
  initialCursor,
  limit,
  fetchCallback,
  changeQueryParams,
}: PaginationProps): IPagination {
  const startCursor = ref<string | null>(initialCursor ?? null);
  const pages = ref<Page[]>([
    { cursor: startCursor.value, from: 0, to: limit - 1, itemCount: 0 },
  ]);
  const currentPageIndex = ref<number>(0);
  const currentPage = ref<Page>({
    cursor: startCursor.value,
    from: 0,
    to: limit - 1,
    itemCount: 0,
  });

  const hasPrevious = computed(() => {
    return currentPage.value.cursor !== startCursor.value;
  });

  const hasNext = computed(() => {
    return (
      currentPage.value.itemCount
      === currentPage.value.to - currentPage.value.from + 1
    );
  });

  const updateCurrentPage = async () => {
    currentPage.value
      = pages.value[currentPageIndex.value] ?? currentPage.value;
    const queryParams = { cursor: currentPage.value.cursor ?? undefined };
    changeQueryParams(queryParams);
  };

  const lastPage = (): Page => {
    return pages.value[pages.value.length - 1] ?? currentPage.value;
  };

  const findPageByCursor = (cursor: Cursor): Page | undefined => {
    return pages.value.find(page => page.cursor === cursor);
  };

  const findNextPage = (page: Page): Page | undefined => {
    const pageIndex = pages.value.findIndex(p => p === page);
    return pages.value[pageIndex + 1];
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

  const nextPage = async (): Promise<Page> => {
    let nextPage = pages.value[currentPageIndex.value + 1];
    if (nextPage) {
      currentPageIndex.value++;
    }
    else {
      nextPage = pages.value[currentPageIndex.value]!;
    }

    const response = await fetchCallback({
      cursor: nextPage.cursor ?? undefined,
      limit,
    });
    nextPage.itemCount = response.result.length;
    if (!findPageByCursor(response.paging_metadata.cursor)) {
      addPage(response.paging_metadata.cursor);
    }
    await updateCurrentPage();

    return nextPage;
  };

  const previousPage = async (): Promise<Page> => {
    let previousPage = pages.value[currentPageIndex.value - 1];
    if (previousPage) {
      currentPageIndex.value--;
    }
    else {
      previousPage = currentPage.value;
    }
    await fetchCallback({ cursor: previousPage.cursor ?? undefined, limit });
    await updateCurrentPage();
    return previousPage;
  };

  const reloadPage = async (page: Page) => {
    const response = await fetchCallback({
      cursor: page.cursor ?? undefined,
      limit,
    });
    page.itemCount = response.result.length;
    const nextPage = findNextPage(page);
    if (nextPage) {
      nextPage.cursor = response.paging_metadata.cursor;
    }
  };

  const resetCursor = async () => {
    startCursor.value = null;
    pages.value = [
      { cursor: startCursor.value, from: 0, to: limit - 1, itemCount: 0 },
    ];
    currentPageIndex.value = 0;
    await updateCurrentPage();
    await nextPage();
    changeQueryParams({ cursor: undefined });
  };

  const reloadCurrentPage = async () => {
    await reloadPage(currentPage.value);
  };

  return {
    resetCursor,
    hasPrevious,
    hasNext,
    nextPage,
    previousPage,
    currentPage,
    reloadCurrentPage,
  };
}
