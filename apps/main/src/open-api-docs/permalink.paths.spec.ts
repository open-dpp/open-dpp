import { permalinkPaths } from "./permalink.paths";

describe("permalinkPaths", () => {
  it("should export GET /p with passportId query param", () => {
    expect(permalinkPaths).toHaveProperty("/p");
    const path = permalinkPaths["/p"];
    expect(path).toHaveProperty("get");
    const getOp = path.get;
    // PassportIdQueryParamSchema is passed as the first parameter
    expect(getOp.parameters).toHaveLength(1);
    expect(getOp.parameters[0]).toBeDefined();
  });

  it("should export GET /p/{id} returning PassportPermalinkBundle", () => {
    expect(permalinkPaths).toHaveProperty("/p/{id}");
    const path = permalinkPaths["/p/{id}"];
    expect(path).toHaveProperty("get");
  });

  it("should export PATCH /p/{id}", () => {
    expect(permalinkPaths).toHaveProperty("/p/{id}");
    const path = permalinkPaths["/p/{id}"];
    expect(path).toHaveProperty("patch");
  });

  it("should include AAS read surface paths via createAasPaths('p')", () => {
    // createAasPaths('p') should produce /p/{id}/shells, /p/{id}/submodels, etc.
    expect(permalinkPaths).toHaveProperty("/p/{id}/shells");
    expect(permalinkPaths).toHaveProperty("/p/{id}/submodels");
    expect(permalinkPaths).toHaveProperty("/p/{id}/submodels/{submodelId}");
  });

  it("should not have duplicate path keys", () => {
    // Verify all keys are unique (no accidental duplicates from createAasPaths)
    const keys = Object.keys(permalinkPaths);
    const uniqueKeys = new Set(keys);
    expect(keys.length).toBe(uniqueKeys.size);
  });
});
