export function makeIdShortPath(segments: readonly string[]) {
  return {
    addPathSegment: (segment: string) => makeIdShortPath([...segments, segment]),
    toString: () => segments.join("."),
  };
}

makeIdShortPath.fromString = (path: string) => makeIdShortPath(path.split("."));

export const idShortPathRoot = makeIdShortPath([]);
export type IdShortPath = ReturnType<typeof makeIdShortPath>;
