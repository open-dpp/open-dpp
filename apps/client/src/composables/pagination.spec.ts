import type { PagingParamsDto } from "@open-dpp/dto";
import type { Page, PagingResult } from "./pagination.ts";
import { describe, expect, it, vi } from "vitest";
import { usePagination } from "./pagination.ts";

describe("pagination", () => {
  const changeQueryParams = vi.fn();
  async function fetchCallback(params: PagingParamsDto, items: number[]): Promise<PagingResult> {
    const fromIndex = params.cursor ? Number(params.cursor) + 1 : 0;
    const result = items.slice(fromIndex, fromIndex + params.limit!);
    return { paging_metadata: { cursor: String(result[result.length - 1]) }, result };
  }
  it("should navigate through pages", async () => {
    const items = [0, 1, 2, 3, 4, 5, 6];

    const {
      hasNext,
      resetCursor,
      hasPrevious,
      previousPage,
      nextPage,
      currentPage,
      reloadCurrentPage,
    } = usePagination({
      limit: 2,
      fetchCallback: (params) => fetchCallback(params, items),
      changeQueryParams,
    });

    const firstPageExpect: Page = {
      cursor: null,
      itemCount: 2,
      from: 0,
      to: 1,
    };
    const secondPageExpect = {
      cursor: "1",
      itemCount: 2,
      from: 2,
      to: 3,
    };
    const thirdPageExpect = {
      cursor: "3",
      itemCount: 2,
      from: 4,
      to: 5,
    };
    const fourthPageExpect = {
      cursor: "5",
      itemCount: 1,
      from: 6,
      to: 7,
    };
    const fifthPageExpect = {
      cursor: "6",
      itemCount: 0,
      from: 8,
      to: 9,
    };
    await nextPage();
    expect(currentPage.value).toEqual(firstPageExpect);
    expect(changeQueryParams).toHaveBeenCalledWith({ cursor: undefined });
    expect(hasNext.value).toBeTruthy();
    expect(hasPrevious.value).toBeFalsy();
    await nextPage();
    expect(currentPage.value).toEqual(secondPageExpect);
    expect(changeQueryParams).toHaveBeenCalledWith({ cursor: "1" });
    expect(hasNext.value).toBeTruthy();
    expect(hasPrevious.value).toBeTruthy();
    await nextPage();
    expect(currentPage.value).toEqual(thirdPageExpect);
    expect(changeQueryParams).toHaveBeenCalledWith({ cursor: "3" });
    await previousPage();
    expect(currentPage.value).toEqual(secondPageExpect);
    expect(changeQueryParams).toHaveBeenCalledWith({ cursor: "1" });
    await previousPage();
    expect(currentPage.value).toEqual(firstPageExpect);
    expect(changeQueryParams).toHaveBeenCalledWith({ cursor: undefined });
    await nextPage();
    await nextPage();
    expect(currentPage.value).toEqual(thirdPageExpect);
    await nextPage();
    await nextPage();
    expect(currentPage.value).toEqual(fifthPageExpect);
    await previousPage();
    expect(currentPage.value).toEqual(fourthPageExpect);
    items.push(7);
    await reloadCurrentPage();
    expect(currentPage.value).toEqual({ ...fourthPageExpect, itemCount: 2 });
    await nextPage();
    expect(currentPage.value).toEqual({ ...fifthPageExpect, cursor: "7" });
    expect(hasNext.value).toBeFalsy();
    await resetCursor();
    expect(currentPage.value).toEqual(firstPageExpect);
    expect(changeQueryParams).toHaveBeenCalledWith({ cursor: undefined });
    expect(hasNext.value).toBeTruthy();
    expect(hasPrevious.value).toBeFalsy();
  });

  async function fetchCallbackNullOnLastPage(
    params: PagingParamsDto,
    items: number[],
  ): Promise<PagingResult> {
    const fromIndex = params.cursor ? Number(params.cursor) + 1 : 0;
    const result = items.slice(fromIndex, fromIndex + params.limit!);
    const hasNextPage = fromIndex + result.length < items.length;
    const last = result[result.length - 1];
    return {
      paging_metadata: { cursor: hasNextPage ? String(last) : null },
      result,
    };
  }

  it("stops on an exactly-full last page when the server sends a null cursor", async () => {
    const items = [0, 1, 2, 3];

    const { hasNext, nextPage, currentPage } = usePagination({
      limit: 2,
      fetchCallback: (params) => fetchCallbackNullOnLastPage(params, items),
      changeQueryParams,
    });

    await nextPage();
    expect(currentPage.value).toEqual({ cursor: null, itemCount: 2, from: 0, to: 1 });
    expect(hasNext.value).toBeTruthy();

    await nextPage();
    expect(currentPage.value).toEqual({ cursor: "1", itemCount: 2, from: 2, to: 3 });
    expect(hasNext.value).toBeFalsy();

    await nextPage();
    expect(currentPage.value).toEqual({ cursor: "1", itemCount: 2, from: 2, to: 3 });
  });

  it("should navigate from initial cursor onwards", async () => {
    const items = [0, 1, 2, 3, 4, 5, 6];

    const { nextPage, currentPage, resetCursor } = usePagination({
      initialCursor: "3",
      limit: 2,
      fetchCallback: (params) => fetchCallback(params, items),
      changeQueryParams,
    });

    const pageAfterReset = {
      cursor: null,
      from: 0,
      itemCount: 2,
      to: 1,
    };

    const firstPageExpect = {
      cursor: "3",
      from: 0,
      itemCount: 2,
      to: 1,
    };

    const secondPageExpect = {
      cursor: "5",
      from: 2,
      itemCount: 1,
      to: 3,
    };

    await nextPage();
    expect(currentPage.value).toEqual(firstPageExpect);

    await nextPage();
    expect(currentPage.value).toEqual(secondPageExpect);

    await resetCursor();
    expect(currentPage.value).toEqual(pageAfterReset);
  });

  it("should expose the total count reported by the endpoint", async () => {
    const items = [0, 1, 2, 3, 4];

    const { nextPage, previousPage, totalCount } = usePagination({
      limit: 2,
      fetchCallback: async (params) => {
        const fromIndex = params.cursor ? Number(params.cursor) + 1 : 0;
        const result = items.slice(fromIndex, fromIndex + params.limit!);
        return {
          paging_metadata: {
            cursor: String(result[result.length - 1]),
            total_count: items.length,
          },
          result,
        };
      },
      changeQueryParams,
    });

    expect(totalCount.value).toBeNull();
    await nextPage();
    expect(totalCount.value).toBe(5);
    await nextPage();
    expect(totalCount.value).toBe(5);
    await previousPage();
    expect(totalCount.value).toBe(5);
  });

  it("should keep the total count null when the endpoint does not report it", async () => {
    const items = [0, 1, 2];

    const { nextPage, totalCount } = usePagination({
      limit: 2,
      fetchCallback: (params) => fetchCallback(params, items),
      changeQueryParams,
    });

    await nextPage();
    expect(totalCount.value).toBeNull();
  });
});
