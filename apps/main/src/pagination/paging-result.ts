import { ConvertToPlainOptions, IConvertableToPlain } from "../aas/domain/convertable-to-plain";
import { removeEmptyItems } from "../utils";
import { Pagination } from "./pagination";

export class PagingResult<T extends IConvertableToPlain> {
  constructor(
    public readonly pagination: Pagination,
    public readonly items: T[],
    public readonly totalCount?: number,
  ) {}

  static create<T extends IConvertableToPlain>(data: {
    pagination: Pagination;
    items: T[];
    totalCount?: number;
  }): PagingResult<T> {
    return new PagingResult(data.pagination, data.items, data.totalCount);
  }

  toPlain(options?: ConvertToPlainOptions) {
    return this.buildPlain((item) => item.toPlain(options));
  }

  /** Like `toPlain`, but lets the caller decide how each item is converted (e.g. to a DTO). */
  toPlainWith(toItemPlain: (item: T) => Record<string, any>) {
    return this.buildPlain(toItemPlain);
  }

  private buildPlain(toItemPlain: (item: T) => Record<string, any>) {
    return {
      paging_metadata: {
        cursor: this.pagination.cursor,
        // Only surfaced by endpoints that compute the total (see findAllByOrganizationId);
        // omitted otherwise so unrelated paginated endpoints keep their existing shape.
        ...(this.totalCount !== undefined ? { total_count: this.totalCount } : {}),
      },
      result: removeEmptyItems(this.items.map(toItemPlain)),
    };
  }
}
