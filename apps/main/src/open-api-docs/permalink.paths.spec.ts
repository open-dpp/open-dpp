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

  // --- Slice 40: org-scoped backoffice routes ---

  it("should export GET + POST /permalinks", () => {
    expect(permalinkPaths).toHaveProperty("/permalinks");
    const path = permalinkPaths["/permalinks"];
    expect(path).toHaveProperty("get");
    expect(path).toHaveProperty("post");
  });

  it("should export PATCH + DELETE /permalinks/{id}", () => {
    expect(permalinkPaths).toHaveProperty("/permalinks/{id}");
    const path = permalinkPaths["/permalinks/{id}"];
    expect(path).toHaveProperty("patch");
    expect(path).toHaveProperty("delete");
  });

  it("should export POST /permalinks/{id}/primary", () => {
    expect(permalinkPaths).toHaveProperty("/permalinks/{id}/primary");
    const path = permalinkPaths["/permalinks/{id}/primary"];
    expect(path).toHaveProperty("post");
  });

  it("GET /permalinks declares OrganizationIdHeader $ref and security", () => {
    const get = permalinkPaths["/permalinks"].get;
    const hasOrgHeader = (get.parameters as unknown[]).some(
      (p) =>
        typeof p === "object" &&
        p !== null &&
        "$ref" in p &&
        (p as { $ref: string })["$ref"] === "#/components/parameters/OrganizationIdHeader",
    );
    expect(hasOrgHeader).toBe(true);
    expect(get.security).toEqual([{ apiKeyAuth: [] }]);
  });

  it("POST /permalinks declares OrganizationIdHeader $ref and security", () => {
    const post = permalinkPaths["/permalinks"].post;
    const hasOrgHeader = (post.parameters as unknown[]).some(
      (p) =>
        typeof p === "object" &&
        p !== null &&
        "$ref" in p &&
        (p as { $ref: string })["$ref"] === "#/components/parameters/OrganizationIdHeader",
    );
    expect(hasOrgHeader).toBe(true);
    expect(post.security).toEqual([{ apiKeyAuth: [] }]);
  });

  it("PATCH /permalinks/{id} declares OrganizationIdHeader $ref and security", () => {
    const patch = permalinkPaths["/permalinks/{id}"].patch;
    const hasOrgHeader = (patch.parameters as unknown[]).some(
      (p) =>
        typeof p === "object" &&
        p !== null &&
        "$ref" in p &&
        (p as { $ref: string })["$ref"] === "#/components/parameters/OrganizationIdHeader",
    );
    expect(hasOrgHeader).toBe(true);
    expect(patch.security).toEqual([{ apiKeyAuth: [] }]);
  });

  it("DELETE /permalinks/{id} declares OrganizationIdHeader $ref and security", () => {
    const del = permalinkPaths["/permalinks/{id}"].delete;
    const hasOrgHeader = (del.parameters as unknown[]).some(
      (p) =>
        typeof p === "object" &&
        p !== null &&
        "$ref" in p &&
        (p as { $ref: string })["$ref"] === "#/components/parameters/OrganizationIdHeader",
    );
    expect(hasOrgHeader).toBe(true);
    expect(del.security).toEqual([{ apiKeyAuth: [] }]);
  });

  it("POST /permalinks/{id}/primary declares OrganizationIdHeader $ref and security", () => {
    const post = permalinkPaths["/permalinks/{id}/primary"].post;
    const hasOrgHeader = (post.parameters as unknown[]).some(
      (p) =>
        typeof p === "object" &&
        p !== null &&
        "$ref" in p &&
        (p as { $ref: string })["$ref"] === "#/components/parameters/OrganizationIdHeader",
    );
    expect(hasOrgHeader).toBe(true);
    expect(post.security).toEqual([{ apiKeyAuth: [] }]);
  });

  // --- Passport-scoped backoffice route ---

  it("should export GET /passports/{id}/permalinks", () => {
    expect(permalinkPaths).toHaveProperty("/passports/{id}/permalinks");
    const path = permalinkPaths["/passports/{id}/permalinks"];
    expect(path).toHaveProperty("get");
  });

  it("GET /passports/{id}/permalinks declares OrganizationIdHeader $ref and security", () => {
    const get = permalinkPaths["/passports/{id}/permalinks"].get;
    const hasOrgHeader = (get.parameters as unknown[]).some(
      (p) =>
        typeof p === "object" &&
        p !== null &&
        "$ref" in p &&
        (p as { $ref: string })["$ref"] === "#/components/parameters/OrganizationIdHeader",
    );
    expect(hasOrgHeader).toBe(true);
    expect(get.security).toEqual([{ apiKeyAuth: [] }]);
  });
});
