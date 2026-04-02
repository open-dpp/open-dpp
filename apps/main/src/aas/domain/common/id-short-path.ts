export class IdShortPath {
  constructor(private readonly _segments: Array<string>) {
  }

  static create(data: { path: string }): IdShortPath {
    return new IdShortPath(data.path.split("."));
  }

  addPathSegment(segment: string) {
    return new IdShortPath([...this._segments, segment]);
  }

  isChildOf(idShortPath: IdShortPath): boolean {
    if (idShortPath.length() > this.length()) {
      return false;
    }
    return idShortPath.first === this.first;
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

  toString(): string {
    return this._segments.join(".");
  }
}
