export interface IdShortPath {
  addPathSegment: (segment: string) => IdShortPath;
  /** The path to this path's containing element, i.e. itself minus its last segment. The root's parent is itself. */
  parent: () => IdShortPath;
  isEqual: (other: IdShortPath) => boolean;
  /** Whether `other` is this path itself, or one of its ancestors at any depth — the mirror of `other.contains(this)`. */
  isChildOf: (other: IdShortPath) => boolean;
  /** Whether `other` is this path's immediate container, i.e. `this.parent()` equals `other`. */
  isDirectChildOf: (other: IdShortPath) => boolean;
  /** Whether `other` is this path itself, or nested anywhere beneath it. The root contains every path, including itself. */
  contains: (other: IdShortPath) => boolean;
  toString: () => string;
  length: () => number;
  segments: readonly string[];
}

export function makeIdShortPath(segments: readonly string[]): IdShortPath {
  const path = segments.join(".");
  function toString(): string {
    return path;
  }

  function isEqual(other: IdShortPath): boolean {
    return toString() === other.toString();
  }

  function parent(): IdShortPath {
    return makeIdShortPath(segments.slice(0, -1));
  }

  function isChildOf(other: IdShortPath): boolean {
    if (other.length() > length()) {
      return false;
    }
    for (let i = 0; i < other.length(); i++) {
      if (segments[i] !== other.segments[i]) {
        return false;
      }
    }
    return true;
  }

  function isDirectChildOf(other: IdShortPath): boolean {
    return parent().isEqual(other);
  }

  function contains(other: IdShortPath) {
    const otherPath = other.toString();
    return path === "" || isEqual(other) || otherPath.startsWith(`${path}.`);
  }

  function length(): number {
    return segments.length;
  }

  return {
    addPathSegment: (segment: string) => makeIdShortPath([...segments, segment]),
    parent,
    isEqual,
    isChildOf,
    isDirectChildOf,
    contains,
    toString,
    length,
    segments,
  };
}

makeIdShortPath.fromString = (path: string) => makeIdShortPath(path === "" ? [] : path.split("."));

export const idShortPathRoot = makeIdShortPath([]);
