import { ConvertToPlainOptions, IConvertableToPlain } from "../aas/domain/convertable-to-plain";
import { removeEmptyItems } from "../utils";
import { Pagination } from "./pagination";

export class PagingResult<T extends IConvertableToPlain> {
  constructor(
    public readonly pagination: Pagination,
    public readonly items: T[],
  ) {}

  static create<T extends IConvertableToPlain>(data: {
    pagination: Pagination;
    items: T[];
  }): PagingResult<T> {
    return new PagingResult(data.pagination, data.items);
  }

  toPlain(options?: ConvertToPlainOptions) {
    return {
      paging_metadata: { cursor: this.pagination.cursor },
      result: removeEmptyItems(this.items.map((item) => item.toPlain(options))),
    };
  }
}
