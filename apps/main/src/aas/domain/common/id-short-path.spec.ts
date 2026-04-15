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
});
