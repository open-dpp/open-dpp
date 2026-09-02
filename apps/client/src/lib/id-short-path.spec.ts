import { describe, expect, it } from "vitest";
import { idShortPathRoot, makeIdShortPath } from "./id-short-path.ts";

describe("makeIdShortPath", () => {
  it("stringifies an empty path as an empty string", () => {
    expect(makeIdShortPath([]).toString()).toBe("");
  });

  it("stringifies segments joined by dots", () => {
    expect(makeIdShortPath(["Nameplate", "Weight"]).toString()).toBe("Nameplate.Weight");
  });

  it("addPathSegment appends a segment without a leading dot from an empty path", () => {
    expect(makeIdShortPath([]).addPathSegment("Nameplate").toString()).toBe("Nameplate");
  });

  it("addPathSegment appends a segment to an existing path", () => {
    const path = makeIdShortPath(["Dimensions"]).addPathSegment("Width");
    expect(path.toString()).toBe("Dimensions.Width");
  });

  it("addPathSegment does not mutate the original path", () => {
    const path = makeIdShortPath(["Dimensions"]);
    path.addPathSegment("Width");
    expect(path.toString()).toBe("Dimensions");
  });

  it("chains multiple addPathSegment calls", () => {
    const path = makeIdShortPath([])
      .addPathSegment("Dimensions")
      .addPathSegment("SubDimensions")
      .addPathSegment("Width");
    expect(path.toString()).toBe("Dimensions.SubDimensions.Width");
  });

  it("fromString splits a dotted path into segments", () => {
    expect(makeIdShortPath.fromString("Dimensions.Width").toString()).toBe("Dimensions.Width");
  });

  it("fromString round-trips with addPathSegment", () => {
    const path = makeIdShortPath.fromString("Dimensions").addPathSegment("Width");
    expect(path.toString()).toBe("Dimensions.Width");
  });

  it("parent strips the last segment", () => {
    const path = makeIdShortPath(["Dimensions", "SubDimensions", "Width"]);
    expect(path.parent().toString()).toBe("Dimensions.SubDimensions");
  });

  it("parent of a top-level path is the root", () => {
    expect(makeIdShortPath(["Nameplate"]).parent().toString()).toBe("");
  });

  it("parent does not mutate the original path", () => {
    const path = makeIdShortPath(["Dimensions", "Width"]);
    path.parent();
    expect(path.toString()).toBe("Dimensions.Width");
  });

  it("isEqual is true only for the exact same segments", () => {
    expect(
      makeIdShortPath(["Dimensions", "Width"]).isEqual(makeIdShortPath(["Dimensions", "Width"])),
    ).toBe(true);
    expect(makeIdShortPath(["Dimensions", "Width"]).isEqual(makeIdShortPath(["Dimensions"]))).toBe(
      false,
    );
  });

  it("isChildOf is true for an ancestor at any depth, including itself and the root", () => {
    const width = makeIdShortPath(["Dimensions", "SubDimensions", "Width"]);
    expect(width.isChildOf(makeIdShortPath(["Dimensions", "SubDimensions"]))).toBe(true);
    // Matches the backend: not just the immediate parent, but any ancestor.
    expect(width.isChildOf(makeIdShortPath(["Dimensions"]))).toBe(true);
    expect(width.isChildOf(idShortPathRoot)).toBe(true);
    expect(width.isChildOf(width)).toBe(true);
  });

  it("isChildOf is false for a sibling or an unrelated path", () => {
    const width = makeIdShortPath(["Dimensions", "SubDimensions", "Width"]);
    expect(width.isChildOf(makeIdShortPath(["Dimensions", "SubDimensions", "Height"]))).toBe(false);
    expect(width.isChildOf(makeIdShortPath(["Weight"]))).toBe(false);
  });

  it("isDirectChildOf is true only for its immediate parent", () => {
    const width = makeIdShortPath(["Dimensions", "Width"]);
    expect(width.isDirectChildOf(makeIdShortPath(["Dimensions"]))).toBe(true);
  });

  it("isDirectChildOf is false for anything other than its immediate parent", () => {
    const width = makeIdShortPath(["Dimensions", "SubDimensions", "Width"]);
    // A grandparent, a sibling, and itself are all not the immediate parent.
    expect(width.isDirectChildOf(makeIdShortPath(["Dimensions"]))).toBe(false);
    expect(width.isDirectChildOf(makeIdShortPath(["Dimensions", "SubDimensions", "Height"]))).toBe(
      false,
    );
    expect(width.isDirectChildOf(width)).toBe(false);
  });

  it("contains itself and anything nested beneath it", () => {
    const dimensions = makeIdShortPath(["Dimensions"]);
    expect(dimensions.contains(dimensions)).toBe(true);
    expect(dimensions.contains(makeIdShortPath(["Dimensions", "Width"]))).toBe(true);
    expect(dimensions.contains(makeIdShortPath(["Dimensions", "Sub", "Width"]))).toBe(true);
  });

  it("does not contain a sibling or an unrelated path with the same prefix", () => {
    const dimensions = makeIdShortPath(["Dimensions"]);
    expect(dimensions.contains(makeIdShortPath(["Weight"]))).toBe(false);
    // "DimensionsExtra" merely starts with the string "Dimensions" but isn't
    // nested under it as a path segment — the dot boundary must be respected.
    expect(dimensions.contains(makeIdShortPath(["DimensionsExtra"]))).toBe(false);
  });
});

describe("idShortPathRoot", () => {
  it("is an empty path", () => {
    expect(idShortPathRoot.toString()).toBe("");
  });

  it("does not accumulate state across separate builds from the root", () => {
    idShortPathRoot.addPathSegment("Nameplate");
    idShortPathRoot.addPathSegment("TechnicalData");
    expect(idShortPathRoot.toString()).toBe("");
  });

  it("is its own parent", () => {
    expect(idShortPathRoot.parent().toString()).toBe("");
  });

  it("contains every path, including itself", () => {
    expect(idShortPathRoot.contains(idShortPathRoot)).toBe(true);
    expect(idShortPathRoot.contains(makeIdShortPath(["Nameplate", "Weight"]))).toBe(true);
  });
});
