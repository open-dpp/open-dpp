import { describe, expect, it } from "vitest";
import { PagingResult } from "./paging-result";
import { Pagination } from "./pagination";

class Item {
  constructor(private readonly value: Record<string, any>) {}

  toPlain() {
    return this.value;
  }
}

describe("pagingResult", () => {
  const pagination = Pagination.create({ limit: 10 });

  it("converts items with their own toPlain and omits total_count when unknown", () => {
    const result = PagingResult.create({ pagination, items: [new Item({ id: "a" })] });

    expect(result.toPlain()).toEqual({
      paging_metadata: { cursor: pagination.cursor },
      result: [{ id: "a" }],
    });
  });

  it("converts items with the given callback and keeps metadata and total_count", () => {
    const result = PagingResult.create({
      pagination,
      items: [new Item({ id: "a" }), new Item({ id: "b" })],
      totalCount: 2,
    });

    const plain = result.toPlainWith((item) => ({ ...item.toPlain(), extra: true }));

    expect(plain).toEqual({
      paging_metadata: { cursor: pagination.cursor, total_count: 2 },
      result: [
        { id: "a", extra: true },
        { id: "b", extra: true },
      ],
    });
  });

  it("drops items that convert to an empty object", () => {
    const result = PagingResult.create({
      pagination,
      items: [new Item({}), new Item({ id: "b" })],
    });

    expect(result.toPlainWith((item) => item.toPlain()).result).toEqual([{ id: "b" }]);
  });
});
