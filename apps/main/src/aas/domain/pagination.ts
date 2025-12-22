export class Pagination {
  private constructor(private _cursor: string | null, public readonly limit: number | null) {
  }

  static create(data: { cursor?: string; limit?: number }): Pagination {
    return new Pagination(data.cursor ?? null, data.limit ?? null);
  }

  get cursor() {
    return this._cursor;
  }

  setCursor(cursor: string) {
    this._cursor = cursor;
  }

  nextPages(pageIds: string[]) {
    const startIndex = this._cursor ? pageIds.indexOf(this._cursor) + 1 : 0;
    const nextPages = this.limit ? pageIds.slice(startIndex, startIndex + this.limit) : pageIds.slice(startIndex);
    this._cursor = nextPages[nextPages.length - 1];
    return nextPages;
  }
}
