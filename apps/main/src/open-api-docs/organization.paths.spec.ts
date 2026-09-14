import { describe, expect, it } from "@jest/globals";
import { buildOpenApiDocumentation } from "./index";
import { organizationsPaths } from "./organization.paths";

type SchemaObject = { properties?: Record<string, unknown>; required?: string[] };

describe("organizationsPaths", () => {
  it("exports POST /organizations", () => {
    expect(organizationsPaths).toHaveProperty("/organizations");
    expect(organizationsPaths["/organizations"]).toHaveProperty("post");
  });

  it("documents the create body as { name } and a 201 response without slug", () => {
    const document = buildOpenApiDocumentation();
    const post = document.paths?.["/organizations"]?.post as Record<string, any> | undefined;

    const body = post?.requestBody?.content?.["application/json"]?.schema as SchemaObject;
    expect(Object.keys(body.properties ?? {})).toEqual(["name"]);
    expect(body.required).toEqual(["name"]);

    const created = post?.responses?.["201"]?.content?.["application/json"]?.schema as SchemaObject;
    expect(created.properties).toHaveProperty("id");
    expect(created.properties).toHaveProperty("name");
    expect(created.properties).not.toHaveProperty("slug");
    expect(created.properties).not.toHaveProperty("members");
  });
});
