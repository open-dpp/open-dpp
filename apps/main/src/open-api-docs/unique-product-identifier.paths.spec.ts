import { uniqueProductIdentifierPaths } from "./unique-product-identifier.paths";

describe("uniqueProductIdentifierPaths", () => {
  it("should export GET + POST /unique-product-identifiers", () => {
    expect(uniqueProductIdentifierPaths).toHaveProperty("/unique-product-identifiers");
    const path = uniqueProductIdentifierPaths["/unique-product-identifiers"];
    expect(path).toHaveProperty("get");
    expect(path).toHaveProperty("post");
  });

  it("should export GET + PATCH + DELETE /unique-product-identifiers/{id}", () => {
    expect(uniqueProductIdentifierPaths).toHaveProperty("/unique-product-identifiers/{id}");
    const path = uniqueProductIdentifierPaths["/unique-product-identifiers/{id}"];
    expect(path).toHaveProperty("get");
    expect(path).toHaveProperty("patch");
    expect(path).toHaveProperty("delete");
  });

  it("list GET declares OrganizationIdHeader $ref and security", () => {
    const get = uniqueProductIdentifierPaths["/unique-product-identifiers"].get;
    const hasOrgHeader = get.parameters.some(
      (p: unknown) =>
        typeof p === "object" &&
        p !== null &&
        "$ref" in p &&
        (p as { $ref: string })["$ref"] === "#/components/parameters/OrganizationIdHeader",
    );
    expect(hasOrgHeader).toBe(true);
    expect(get.security).toEqual([{ apiKeyAuth: [] }]);
  });

  it("create POST declares OrganizationIdHeader $ref and security", () => {
    const post = uniqueProductIdentifierPaths["/unique-product-identifiers"].post;
    const hasOrgHeader = post.parameters.some(
      (p: unknown) =>
        typeof p === "object" &&
        p !== null &&
        "$ref" in p &&
        (p as { $ref: string })["$ref"] === "#/components/parameters/OrganizationIdHeader",
    );
    expect(hasOrgHeader).toBe(true);
    expect(post.security).toEqual([{ apiKeyAuth: [] }]);
  });

  it("should export POST /unique-product-identifiers/internal with org header + security (ADR 0005)", () => {
    expect(uniqueProductIdentifierPaths).toHaveProperty("/unique-product-identifiers/internal");
    const post = uniqueProductIdentifierPaths["/unique-product-identifiers/internal"].post;
    expect(post).toBeDefined();
    const hasOrgHeader = post.parameters.some(
      (p: unknown) =>
        typeof p === "object" &&
        p !== null &&
        "$ref" in p &&
        (p as { $ref: string })["$ref"] === "#/components/parameters/OrganizationIdHeader",
    );
    expect(hasOrgHeader).toBe(true);
    expect(post.security).toEqual([{ apiKeyAuth: [] }]);
  });

  it("should export GET /passports/{id}/unique-product-identifiers", () => {
    expect(uniqueProductIdentifierPaths).toHaveProperty(
      "/passports/{id}/unique-product-identifiers",
    );
    const path = uniqueProductIdentifierPaths["/passports/{id}/unique-product-identifiers"];
    expect(path).toHaveProperty("get");
  });

  it("passport-scoped GET declares OrganizationIdHeader $ref and security", () => {
    const get = uniqueProductIdentifierPaths["/passports/{id}/unique-product-identifiers"].get;
    const hasOrgHeader = get.parameters.some(
      (p: unknown) =>
        typeof p === "object" &&
        p !== null &&
        "$ref" in p &&
        (p as { $ref: string })["$ref"] === "#/components/parameters/OrganizationIdHeader",
    );
    expect(hasOrgHeader).toBe(true);
    expect(get.security).toEqual([{ apiKeyAuth: [] }]);
  });

  it("should not have duplicate path keys", () => {
    const keys = Object.keys(uniqueProductIdentifierPaths);
    const uniqueKeys = new Set(keys);
    expect(keys.length).toBe(uniqueKeys.size);
  });
});
