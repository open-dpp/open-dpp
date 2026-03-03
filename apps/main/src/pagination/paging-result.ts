import { IConvertableToPlain } from "../aas/domain/convertable-to-plain";
import { Pagination } from "./pagination";

export class PagingResult<T extends IConvertableToPlain> {
  constructor(public readonly pagination: Pagination, public readonly items: T[]) {
  }

  static create<T extends IConvertableToPlain>(data: { pagination: Pagination; items: T[] }): PagingResult<T> {
    return new PagingResult(data.pagination, data.items);
  }

  toPlain() {
    return {
      paging_metadata: { cursor: this.pagination.cursor },
      result: this.items.map(item => item.toPlain()),
    };
  }
}
