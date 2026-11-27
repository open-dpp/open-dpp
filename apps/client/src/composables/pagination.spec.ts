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

  describe("with three pages that were all opened before", () => {
    const items = [0, 1, 2, 3, 4, 5];
    const firstPage: Page = { cursor: null, itemCount: 2, from: 0, to: 1 };
    const secondPage: Page = { cursor: "1", itemCount: 2, from: 2, to: 3 };
    const thirdPage: Page = { cursor: "3", itemCount: 2, from: 4, to: 5 };

    /**
     * A list on its third page. `shown` holds the items of the last answer, as a list keeps
     * them in its fetch callback. `beforeAnswer` runs before an answer comes back.
     */
    async function openThirdPage() {
      const list = {
        shown: [] as number[],
        beforeAnswer: async (_params: PagingParamsDto): Promise<void> => {},
      };
      const pagination = usePagination({
        limit: 2,
        fetchCallback: async (params) => {
          const answer = await fetchCallbackNullOnLastPage(params, items);
          await list.beforeAnswer(params);
          list.shown = answer.result;
          return answer;
        },
        changeQueryParams,
      });
      await pagination.nextPage();
      await pagination.nextPage();
      await pagination.nextPage();
      return { list, ...pagination };
    }

    function failEveryRequest() {
      return async () => {
        throw new Error("offline");
      };
    }

    it("stays on the shown page when the next one cannot be fetched", async () => {
      const { list, nextPage, previousPage, currentPage } = await openThirdPage();
      await previousPage();
      await previousPage();

      list.beforeAnswer = failEveryRequest();
      await expect(nextPage()).rejects.toThrow("offline");
      expect(currentPage.value).toEqual(firstPage);

      list.beforeAnswer = async () => {};
      await nextPage();
      expect(currentPage.value).toEqual(secondPage);
      expect(list.shown).toEqual([2, 3]);
    });

    it("stays on the shown page when the previous one cannot be fetched", async () => {
      const { list, previousPage, currentPage } = await openThirdPage();

      list.beforeAnswer = failEveryRequest();
      await expect(previousPage()).rejects.toThrow("offline");
      expect(currentPage.value).toEqual(thirdPage);

      list.beforeAnswer = async () => {};
      await previousPage();
      expect(currentPage.value).toEqual(secondPage);
      expect(list.shown).toEqual([2, 3]);
    });

    it("stays on the shown page when the first one cannot be fetched", async () => {
      const { list, resetCursor, previousPage, currentPage, hasPrevious, hasNext } =
        await openThirdPage();
      await previousPage();
      changeQueryParams.mockClear();

      list.beforeAnswer = failEveryRequest();
      await expect(resetCursor()).rejects.toThrow("offline");
      expect(currentPage.value).toEqual(secondPage);
      expect(hasPrevious.value).toBe(true);
      expect(hasNext.value).toBe(true);
      expect(changeQueryParams).not.toHaveBeenCalled();

      list.beforeAnswer = async () => {};
      await resetCursor();
      expect(currentPage.value).toEqual(firstPage);
      expect(hasPrevious.value).toBe(false);
      expect(hasNext.value).toBe(true);
      expect(changeQueryParams).toHaveBeenCalledWith({ cursor: undefined });
      expect(list.shown).toEqual([0, 1]);
    });

    it("shows the items of the page it names when two navigations overlap", async () => {
      const { list, nextPage, previousPage, currentPage } = await openThirdPage();
      await previousPage();
      await previousPage();
      // The second page takes longer to answer than the third
      const answerDelayMs: Record<string, number> = { "1": 20, "3": 10 };
      list.beforeAnswer = (params) =>
        new Promise((resolve) => setTimeout(resolve, answerDelayMs[params.cursor ?? ""] ?? 0));
      vi.useFakeTimers();

      try {
        const navigations = [nextPage(), nextPage()];
        await vi.runAllTimersAsync();
        await Promise.all(navigations);
      } finally {
        vi.useRealTimers();
      }

      expect(currentPage.value).toEqual(thirdPage);
      expect(list.shown).toEqual([4, 5]);
    });
  });
});
