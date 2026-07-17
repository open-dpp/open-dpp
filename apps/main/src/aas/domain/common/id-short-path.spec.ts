import { expect } from "@jest/globals";
import { IdShortPath } from "./id-short-path";

describe("id-short-path", () => {
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
      IdShortPath.create({ path: "path1" }).isAncestorOf(IdShortPath.create({ path: "path1.path2" })),
    ).toBeTruthy();
    expect(
      IdShortPath.create({ path: "path1.path2" }).isAncestorOf(IdShortPath.create({ path: "path1" })),
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
