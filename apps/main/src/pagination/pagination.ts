import { Buffer } from "node:buffer";

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
    this._cursor = nextPages[nextPages.length - 1] ?? null;
    return nextPages;
  }
}

export function encodeCursor(createdAtIsoString: string, id: string) {
  const payload = JSON.stringify({ createdAt: createdAtIsoString, id });
  return Buffer.from(payload).toString("base64url");
}

export function decodeCursor(cursor: string) {
  const json = Buffer.from(cursor, "base64url").toString("utf8");
  return JSON.parse(json);
}
