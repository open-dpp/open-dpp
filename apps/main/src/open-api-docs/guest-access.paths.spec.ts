import { buildOpenApiDocumentation } from "./index";

describe("guestAccessPaths", () => {
  const document = buildOpenApiDocumentation();

  it.each([
    ["/guest-accesses", ["post", "get"]],
    ["/guest-accesses/{id}/role", ["patch"]],
    ["/guest-accesses/{id}/revoke", ["post"]],
    ["/guest-accesses/{id}/invitation", ["get"]],
    ["/guest-accesses/{id}/accept", ["post"]],
  ])("documents %s", (path, methods) => {
    for (const method of methods) {
      expect(document.paths?.[path]).toHaveProperty(method);
    }
  });

  it("requires the organization header for owner endpoints only", () => {
    const hasOrgHeader = (path: string, method: "get" | "post" | "patch") =>
      (document.paths?.[path]?.[method]?.parameters as { $ref?: string }[]).some(
        (p) => p.$ref === "#/components/parameters/OrganizationIdHeader",
      );

    expect(hasOrgHeader("/guest-accesses", "post")).toBe(true);
    expect(hasOrgHeader("/guest-accesses/{id}/role", "patch")).toBe(true);
    expect(hasOrgHeader("/guest-accesses/{id}/invitation", "get")).toBe(false);
    expect(hasOrgHeader("/guest-accesses/{id}/accept", "post")).toBe(false);
  });
});
