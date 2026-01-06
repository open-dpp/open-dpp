import type { PagingParamsDto } from "@open-dpp/dto";
import { ref } from "vue";

export type Cursor = string | null;

export interface Page {
  from: number;
  to: number;
  itemCount: number;
  cursor: Cursor;
}
export interface PagingResult { paging_metadata: { cursor: Cursor }; result: any[] }
interface PaginationProps { limit: number; fetchCallback: (pagingParams: PagingParamsDto) => Promise<PagingResult> }
export function usePagination({ limit, fetchCallback }: PaginationProps) {
  const startPage = { cursor: null, from: 0, to: limit - 1, itemCount: 0 };
  const pages = ref<Page[]>([startPage]);
  const currentPageIndex = ref<number>(0);
  const currentPage = ref<Page>(startPage);
  const updateCurrentPage = () => {
    currentPage.value = pages.value[currentPageIndex.value] ?? startPage;
  };
  const lastPage = (): Page => {
    return pages.value[pages.value.length - 1] ?? startPage;
  };
  const findPageByCursor = (cursor: Cursor): Page | undefined => {
    return pages.value.find(page => page.cursor === cursor);
  };
  const addPage = (cursor: Cursor) => {
    const fromIndex = lastPage().to + 1;
    pages.value.push({ from: fromIndex, to: fromIndex + limit, cursor, itemCount: 0 });
  };
  const nextPage = async (): Promise<Page> => {
    let nextPage = pages.value[currentPageIndex.value + 1];
    if (nextPage) {
      currentPageIndex.value++;
    }
    else {
      nextPage = currentPage.value;
    }

    const response = await fetchCallback({ cursor: nextPage.cursor ?? undefined, limit });
    nextPage.itemCount = response.result.length;
    addPage(response.paging_metadata.cursor);
    updateCurrentPage();

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
    updateCurrentPage();
    return previousPage;
  };

  const reloadPage = async (page: Page) => {
    const response = await fetchCallback({ cursor: page.cursor ?? undefined, limit });
    page.itemCount = response.result.length;
    lastPage().cursor = response.paging_metadata.cursor;
  };

  const onAddItem = async () => {
    if (currentPage.value.itemCount < limit) {
      await reloadPage(currentPage.value);
    }
    else {
      await nextPage();
    }
  };

  return { nextPage, previousPage, currentPage, onAddItem };
}
