import { describe, expect, it } from "vitest";
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
    const hasOrgHeader = (path: string, method: "get" | "post" | "patch") => {
      const parameters = (document.paths?.[path]?.[method]?.parameters ?? []) as {
        $ref?: string;
      }[];
      return parameters.some((p) => p.$ref === "#/components/parameters/OrganizationIdHeader");
    };

    expect(hasOrgHeader("/guest-accesses", "post")).toBe(true);
    expect(hasOrgHeader("/guest-accesses/{id}/role", "patch")).toBe(true);
    expect(hasOrgHeader("/guest-accesses/{id}/invitation", "get")).toBe(false);
    expect(hasOrgHeader("/guest-accesses/{id}/accept", "post")).toBe(false);
  });

  it("documents the status codes the controller answers with", () => {
    const successCodes = (path: string, method: "post" | "patch") =>
      Object.keys(document.paths?.[path]?.[method]?.responses ?? {}).filter((code) =>
        code.startsWith("2"),
      );

    expect(successCodes("/guest-accesses", "post")).toEqual(["201"]);
    expect(successCodes("/guest-accesses/{id}/role", "patch")).toEqual(["200"]);
    expect(successCodes("/guest-accesses/{id}/revoke", "post")).toEqual(["200"]);
    expect(successCodes("/guest-accesses/{id}/accept", "post")).toEqual(["200"]);
  });

  it("documents 403 as not signed in and 404 as an invitation which is not available to the caller", () => {
    const description = (path: string, code: string) =>
      (document.paths?.[path]?.post?.responses?.[code] as { description?: string } | undefined)
        ?.description ?? "";
    const invitation = document.paths?.["/guest-accesses/{id}/invitation"]?.get?.responses as
      | Record<string, { description?: string }>
      | undefined;

    expect(invitation?.["403"]?.description).toMatch(/not signed in/i);
    expect(invitation?.["404"]?.description).toMatch(/another account/i);
    expect(invitation?.["404"]?.description).toMatch(/indistinguishable/i);
    expect(description("/guest-accesses/{id}/accept", "403")).toMatch(/not signed in/i);
    expect(description("/guest-accesses/{id}/accept", "400")).toMatch(/not the invited one/i);
  });

  it("documents the conflict of a concurrent change for the endpoints which change an access", () => {
    const has409 = (path: string, method: "post" | "patch") =>
      "409" in (document.paths?.[path]?.[method]?.responses ?? {});

    expect(has409("/guest-accesses/{id}/role", "patch")).toBe(true);
    expect(has409("/guest-accesses/{id}/revoke", "post")).toBe(true);
    expect(has409("/guest-accesses/{id}/accept", "post")).toBe(true);
    expect(has409("/guest-accesses", "post")).toBe(false);
  });
});
