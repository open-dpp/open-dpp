import { IConvertableToPlain } from "../aas/domain/convertable-to-plain";
import { Pagination } from "./pagination";

export class PagingResult {
  constructor(private readonly pagination: Pagination, private readonly items: IConvertableToPlain[]) {
  }

  static create(data: { pagination: Pagination; items: IConvertableToPlain[] }): PagingResult {
    return new PagingResult(data.pagination, data.items);
  }

  toPlain() {
    return {
      paging_metadata: { cursor: this.pagination.cursor },
      result: this.items.map(item => item.toPlain()),
    };
  }
}
