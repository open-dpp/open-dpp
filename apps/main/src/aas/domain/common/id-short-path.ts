export class IdShortPath {
  constructor(private readonly _segments: Array<string>) {}

  static create(data: { path: string }): IdShortPath {
    return new IdShortPath(data.path.split("."));
  }

  static fromSegments(segments: string[]): IdShortPath {
    return new IdShortPath(segments);
  }

  addPathSegment(segment: string) {
    return new IdShortPath([...this._segments, segment]);
  }

  isChildOf(idShortPath: IdShortPath): boolean {
    // this is a child of idShortPath if:
    // 1. idShortPath is shorter than or equal to this (parent <= child in length)
    // 2. this starts with all segments of idShortPath
    if (idShortPath.length() > this.length()) {
      return false;
    }
    for (let i = 0; i < idShortPath.length(); i++) {
      if (this._segments[i] !== idShortPath._segments[i]) {
        return false;
      }
    }
    return true;
  }

  isAncestorOf(idShortPath: IdShortPath): boolean {
    // this is an ancestor of idShortPath (inverse of idShortPath.isChildOf(this))
    return idShortPath.isChildOf(this);
  }

  isEqual(idShortPath: IdShortPath): boolean {
    return this.toString() === idShortPath.toString();
  }

  concat(idShortPath: IdShortPath) {
    return new IdShortPath([...this.segments, ...idShortPath.segments]);
  }

  getParentPath(): IdShortPath {
    return new IdShortPath(this._segments.slice(0, -1));
  }

  get first(): string | undefined {
    if (this._segments.length === 0) {
      return undefined;
    }
    return this._segments[0];
  }

  get last(): string | undefined {
    if (this._segments.length === 0) {
      return undefined;
    }
    return this._segments[this._segments.length - 1];
  }

  get segments(): IterableIterator<string> {
    return this._segments[Symbol.iterator]();
  }

  length(): number {
    return this._segments.length;
  }

  isEmpty(): boolean {
    return this._segments.length === 0;
  }

  slice(start: number, end?: number): IdShortPath {
    return new IdShortPath(this._segments.slice(start, end));
  }

  toString(): string {
    return this._segments.join(".");
  }
}
