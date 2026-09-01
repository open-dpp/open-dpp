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
});
