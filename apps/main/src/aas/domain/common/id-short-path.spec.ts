import { expect } from "@jest/globals";
import { IdShortPath } from "./id-short-path";
import { ValueError } from "@open-dpp/exception";

describe("id-short-path", () => {
  it("create({ path: '' }) should produce the empty (root) path, not a single empty segment", () => {
    expect(IdShortPath.create({ path: "" })).toEqual(IdShortPath.fromSegments([]));
    expect(IdShortPath.create({ path: "" }).isEmpty()).toBe(true);
    expect(IdShortPath.create({ path: "" }).toString()).toBe("");
  });

  it("should be evaluate startsWith correctly", () => {
    expect(
      IdShortPath.create({ path: "path1" }).isChildOf(IdShortPath.create({ path: "path1" })),
    ).toBeTruthy();
    expect(
      IdShortPath.create({ path: "path1" }).isChildOf(IdShortPath.create({ path: "path2" })),
    ).toBeFalsy();
    expect(
      IdShortPath.create({ path: "path1.path2" }).isChildOf(IdShortPath.create({ path: "path1" })),
    ).toBeTruthy();
    expect(
      IdShortPath.create({ path: "path1" }).isChildOf(IdShortPath.create({ path: "path1.path2" })),
    ).toBeFalsy();
    expect(
      IdShortPath.create({ path: "path1.path2.path3" }).isChildOf(
        IdShortPath.create({ path: "path1" }),
      ),
    ).toBeTruthy();
    expect(
      IdShortPath.create({ path: "path1.path2.path3" }).isChildOf(
        IdShortPath.create({ path: "path1.path2" }),
      ),
    ).toBeTruthy();
  });

  it("should evaluate relativePath correctly", () => {
    expect(
      IdShortPath.create({ path: "path1" }).relativePath(IdShortPath.create({ path: "path1" })),
    ).toEqual(IdShortPath.fromSegments([]));
    expect(
      IdShortPath.create({ path: "path1.path2.path3" }).relativePath(
        IdShortPath.create({ path: "path1.path2" }),
      ),
    ).toEqual(IdShortPath.create({ path: "path3" }));

    expect(() =>
      IdShortPath.create({ path: "path1.path2" }).relativePath(
        IdShortPath.create({ path: "path1.path2.path3" }),
      ),
    ).toThrow(
      new ValueError(
        "To evaluate relative path path1.path2 has to equal or a child of path1.path2.path3",
      ),
    );
  });

  it("should reject diverging paths as children", () => {
    // A.X is NOT a child of A.B (they diverge at second segment)
    expect(
      IdShortPath.create({ path: "A.X" }).isChildOf(IdShortPath.create({ path: "A.B" })),
    ).toBeFalsy();
    expect(
      IdShortPath.create({ path: "A.B.X" }).isChildOf(IdShortPath.create({ path: "A.B.C" })),
    ).toBeFalsy();
    // A.B.C is a child of A.B
    expect(
      IdShortPath.create({ path: "A.B.C" }).isChildOf(IdShortPath.create({ path: "A.B" })),
    ).toBeTruthy();
  });

  it("should evaluate isAncestorOf correctly", () => {
    expect(
      IdShortPath.create({ path: "path1" }).isAncestorOf(IdShortPath.create({ path: "path1" })),
    ).toBeTruthy();
    expect(
      IdShortPath.create({ path: "path1" }).isAncestorOf(IdShortPath.create({ path: "path2" })),
    ).toBeFalsy();
    expect(
      IdShortPath.create({ path: "path1" }).isAncestorOf(
        IdShortPath.create({ path: "path1.path2" }),
      ),
    ).toBeTruthy();
    expect(
      IdShortPath.create({ path: "path1.path2" }).isAncestorOf(
        IdShortPath.create({ path: "path1" }),
      ),
    ).toBeFalsy();
    expect(
      IdShortPath.create({ path: "A.B" }).isAncestorOf(IdShortPath.create({ path: "A.B.C" })),
    ).toBeTruthy();
    expect(
      IdShortPath.create({ path: "A.B" }).isAncestorOf(IdShortPath.create({ path: "A.X" })),
    ).toBeFalsy();
  });

  it("should slice correctly", () => {
    expect(IdShortPath.create({ path: "path1.path2.path3.path4" }).slice(1)).toEqual(
      IdShortPath.create({ path: "path2.path3.path4" }),
    );
  });
});
