import { buildOpenApiDocumentation } from "./index";

describe("buildOpenApiDocumentation", () => {
  it("should build without throwing", () => {
    expect(() => buildOpenApiDocumentation()).not.toThrow();
  });

  it("should contain /unique-product-identifiers with GET and POST", () => {
    const doc = buildOpenApiDocumentation();
    expect(doc.paths).toHaveProperty("/unique-product-identifiers");
    const path = doc.paths["/unique-product-identifiers"];
    expect(path).toHaveProperty("get");
    expect(path).toHaveProperty("post");
  });

  it("should contain /unique-product-identifiers/{id} with GET, PATCH, DELETE", () => {
    const doc = buildOpenApiDocumentation();
    expect(doc.paths).toHaveProperty("/unique-product-identifiers/{id}");
    const path = doc.paths["/unique-product-identifiers/{id}"];
    expect(path).toHaveProperty("get");
    expect(path).toHaveProperty("patch");
    expect(path).toHaveProperty("delete");
  });

  it("should contain /permalinks with GET and POST", () => {
    const doc = buildOpenApiDocumentation();
    expect(doc.paths).toHaveProperty("/permalinks");
    const path = doc.paths["/permalinks"];
    expect(path).toHaveProperty("get");
    expect(path).toHaveProperty("post");
  });

  it("should contain /permalinks/{id} with PATCH and DELETE", () => {
    const doc = buildOpenApiDocumentation();
    expect(doc.paths).toHaveProperty("/permalinks/{id}");
    const path = doc.paths["/permalinks/{id}"];
    expect(path).toHaveProperty("patch");
    expect(path).toHaveProperty("delete");
  });

  it("should contain /permalinks/{id}/primary with POST", () => {
    const doc = buildOpenApiDocumentation();
    expect(doc.paths).toHaveProperty("/permalinks/{id}/primary");
    const path = doc.paths["/permalinks/{id}/primary"];
    expect(path).toHaveProperty("post");
  });

  it("should contain passport-scoped /passports/{id}/permalinks with GET", () => {
    const doc = buildOpenApiDocumentation();
    expect(doc.paths).toHaveProperty("/passports/{id}/permalinks");
    expect(doc.paths["/passports/{id}/permalinks"]).toHaveProperty("get");
  });

  it("should contain passport-scoped /passports/{id}/unique-product-identifiers with GET", () => {
    const doc = buildOpenApiDocumentation();
    expect(doc.paths).toHaveProperty("/passports/{id}/unique-product-identifiers");
    expect(doc.paths["/passports/{id}/unique-product-identifiers"]).toHaveProperty("get");
  });
});
