import { describe, expect, it } from "@jest/globals";
import { buildOpenApiDocumentation } from "./index";
import { organizationsPaths } from "./organization.paths";

type SchemaObject = { properties?: Record<string, unknown>; required?: string[] };

describe("organizationsPaths", () => {
  it("exports POST /organizations", () => {
    expect(organizationsPaths).toHaveProperty("/organizations");
    expect(organizationsPaths["/organizations"]).toHaveProperty("post");
  });

  it("documents the create body as { name, owner? } and a 201 response with optional provisioning", () => {
    const document = buildOpenApiDocumentation();
    const post = document.paths?.["/organizations"]?.post as Record<string, any> | undefined;

    const body = post?.requestBody?.content?.["application/json"]?.schema as SchemaObject;
    expect(Object.keys(body.properties ?? {})).toEqual(["name", "owner"]);
    expect(body.required).toEqual(["name"]);
    const owner = body.properties?.owner as SchemaObject;
    expect(Object.keys(owner.properties ?? {})).toEqual([
      "email",
      "firstName",
      "lastName",
      "locale",
    ]);
    expect(owner.required).toEqual(["email"]);

    const created = post?.responses?.["201"]?.content?.["application/json"]?.schema as SchemaObject;
    expect(created.properties).toHaveProperty("id");
    expect(created.properties).toHaveProperty("name");
    expect(created.properties).toHaveProperty("provisioning");
    expect(created.required).not.toContain("provisioning");
    expect(created.properties).not.toHaveProperty("slug");
    expect(created.properties).not.toHaveProperty("members");

    expect(post?.responses).toHaveProperty("403");
    expect(post?.responses).toHaveProperty("500");
    expect(String(post?.description)).toContain("owner");
  });
});
