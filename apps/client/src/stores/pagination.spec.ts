import type { PagingParamsDto } from "@open-dpp/dto";
import type { Page, PagingResult } from "./pagination.ts";
import { expect, it } from "vitest";
import { usePagination } from "./pagination.ts";

describe("pagination", () => {
  it("should navigate through pages", async () => {
    const items = [0, 1, 2, 3, 4, 5];
    async function fetchCallback(params: PagingParamsDto): Promise<PagingResult> {
      const fromIndex = params.cursor ? Number(params.cursor) + 1 : 0;
      const result = items.slice(fromIndex, fromIndex + params.limit!);
      return { paging_metadata: { cursor: String(result[result.length - 1]) }, result };
    }
    const { previousPage, nextPage, currentPage, onAddItem } = usePagination({ limit: 2, fetchCallback });

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
      cursor: "7",
      itemCount: 1,
      from: 8,
      to: 9,
    };

    await nextPage();
    expect(currentPage.value).toEqual(firstPageExpect);
    await nextPage();
    expect(currentPage.value).toEqual(secondPageExpect);
    await nextPage();
    expect(currentPage.value).toEqual(thirdPageExpect);
    await previousPage();
    expect(currentPage.value).toEqual(secondPageExpect);
    await previousPage();
    expect(currentPage.value).toEqual(firstPageExpect);
    await nextPage();
    await nextPage();
    expect(currentPage.value).toEqual(thirdPageExpect);
    items.push(6);
    await onAddItem();
    expect(currentPage.value).toEqual(fourthPageExpect);
    items.push(7);
    await onAddItem();
    expect(currentPage.value).toEqual({ ...fourthPageExpect, itemCount: 2 });
    await previousPage();
    await previousPage();
    expect(currentPage.value).toEqual(secondPageExpect);
    items.push(8);
    await onAddItem();
    expect(currentPage.value).toEqual(fifthPageExpect);
    await previousPage();
    await previousPage();
    await previousPage();
    expect(currentPage.value).toEqual(secondPageExpect);
    items.push(9);
    await onAddItem();
    expect(currentPage.value).toEqual({ ...fifthPageExpect, itemCount: 2 });
  });
});
