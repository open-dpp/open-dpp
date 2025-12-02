export class Pagination {
  private constructor(private _cursor: string | null, private readonly limit: number) {
  }

  static create(data: { cursor?: string; limit: number }): Pagination {
    return new Pagination(data.cursor ?? null, data.limit);
  }

  get cursor() {
    return this._cursor;
  }

  nextPages(pageIds: string[]) {
    const startIndex = this._cursor ? pageIds.indexOf(this._cursor) + 1 : 0;
    const nextPages = pageIds.slice(startIndex, startIndex + this.limit);
    this._cursor = nextPages[nextPages.length - 1];
    return nextPages;
  }
}
