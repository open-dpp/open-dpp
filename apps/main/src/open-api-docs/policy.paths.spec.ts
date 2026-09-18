import { PolicyKeyList } from "@open-dpp/dto";
import { buildOpenApiDocumentation } from "./index";
import { policyPaths } from "./policy.paths";

describe("policyPaths", () => {
  it("should export GET /policies/organizations/{organizationId}", () => {
    expect(policyPaths).toHaveProperty("/policies/organizations/{organizationId}");
    expect(policyPaths["/policies/organizations/{organizationId}"]).toHaveProperty("get");
  });

  it("GET /policies/organizations/{organizationId} declares OrganizationIdHeader $ref and security", () => {
    const get = policyPaths["/policies/organizations/{organizationId}"].get;
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

  it("is part of the generated OpenAPI document, keyed by every policy key", () => {
    const document = buildOpenApiDocumentation();
    const okResponse = document.paths?.["/policies/organizations/{organizationId}"]?.get
      ?.responses?.["200"] as {
      content?: Record<string, { schema?: { propertyNames?: { enum?: string[] } } }>;
    };
    const schema = okResponse?.content?.["application/json"]?.schema;

    expect(schema?.propertyNames?.enum).toEqual(Object.values(PolicyKeyList));
  });

  describe("pATCH /policies/organizations/{organizationId}/limits", () => {
    const path = "/policies/organizations/{organizationId}/limits";

    it("is exported", () => {
      expect(policyPaths).toHaveProperty(path);
      expect(policyPaths[path]).toHaveProperty("patch");
    });

    it("declares the organizationId path parameter and security", () => {
      const document = buildOpenApiDocumentation();
      const parameters = document.paths?.[path]?.patch?.parameters ?? [];
      const organizationIdParam = parameters.find(
        (p: unknown) =>
          typeof p === "object" && p !== null && "name" in p && p.name === "organizationId",
      );

      expect(organizationIdParam).toMatchObject({ in: "path", required: true });
      expect(policyPaths[path].patch.security).toEqual([{ apiKeyAuth: [] }]);
    });

    it("states that only instance admins may call it", () => {
      const patch = policyPaths[path].patch;

      expect(patch.description).toContain("instance admins");
      expect(patch.responses[403]).toBeDefined();
    });

    it("takes a body keyed by policy key and answers with the new utilization", () => {
      const document = buildOpenApiDocumentation();
      const operation = document.paths?.[path]?.patch as {
        requestBody?: {
          required?: boolean;
          content?: Record<string, { schema?: { propertyNames?: { enum?: string[] } } }>;
        };
        responses?: Record<
          string,
          { content?: Record<string, { schema?: { propertyNames?: { enum?: string[] } } }> }
        >;
      };
      const requestSchema = operation?.requestBody?.content?.["application/json"]?.schema;
      const responseSchema = operation?.responses?.["200"]?.content?.["application/json"]?.schema;

      expect(operation?.requestBody?.required).toBe(true);
      expect(requestSchema?.propertyNames?.enum).toEqual(Object.values(PolicyKeyList));
      expect(responseSchema?.propertyNames?.enum).toEqual(Object.values(PolicyKeyList));
    });
  });
});
