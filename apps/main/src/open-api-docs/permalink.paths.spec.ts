import { describe, expect, it } from "vitest";
import {
  CARRIER_EXPORT_CONTENT_TYPES,
  CARRIER_EXPORT_DEFAULTS,
  CARRIER_EXPORT_LIMITS,
  CarrierErrorCorrectionLevel,
  CarrierExportFormat,
} from "@open-dpp/dto";
import { buildOpenApiDocumentation } from "./index";
import { permalinkPaths } from "./permalink.paths";

type ParameterObject = {
  name?: string;
  in?: string;
  required?: boolean;
  description?: string;
  schema?: Record<string, unknown>;
  $ref?: string;
};

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

  describe("GET /permalinks/{id}/carrier", () => {
    const path = "/permalinks/{id}/carrier";

    function carrierOperation() {
      const document = buildOpenApiDocumentation();
      return document.paths?.[path]?.get as Record<string, any> | undefined;
    }

    function parameter(name: string): ParameterObject | undefined {
      const parameters = (carrierOperation()?.parameters ?? []) as ParameterObject[];
      return parameters.find((p) => p.name === name);
    }

    it("is exported with API key security", () => {
      expect(permalinkPaths).toHaveProperty(path);
      expect(permalinkPaths[path].get.security).toEqual([{ apiKeyAuth: [] }]);
    });

    it("takes the permalink id and no organization header", () => {
      const parameters = (carrierOperation()?.parameters ?? []) as ParameterObject[];

      expect(parameter("id")).toMatchObject({ in: "path", required: true });
      expect(parameters.some((p) => p.$ref?.endsWith("/OrganizationIdHeader"))).toBe(false);
    });

    it("documents every setting as an optional query parameter with its default", () => {
      expect(parameter("format")).toMatchObject({
        in: "query",
        schema: {
          enum: Object.values(CarrierExportFormat),
          default: CARRIER_EXPORT_DEFAULTS.format,
        },
      });
      expect(parameter("moduleSize")).toMatchObject({
        in: "query",
        schema: {
          type: "number",
          minimum: CARRIER_EXPORT_LIMITS.moduleSize.min,
          maximum: CARRIER_EXPORT_LIMITS.moduleSize.max,
          default: CARRIER_EXPORT_DEFAULTS.moduleSize,
        },
      });
      expect(parameter("dpi")).toMatchObject({
        in: "query",
        schema: {
          type: "integer",
          minimum: CARRIER_EXPORT_LIMITS.dpi.min,
          maximum: CARRIER_EXPORT_LIMITS.dpi.max,
          default: CARRIER_EXPORT_DEFAULTS.dpi,
        },
      });
      expect(parameter("errorCorrection")).toMatchObject({
        in: "query",
        schema: {
          enum: Object.values(CarrierErrorCorrectionLevel),
          default: CARRIER_EXPORT_DEFAULTS.errorCorrection,
        },
      });
      for (const name of ["format", "moduleSize", "dpi", "errorCorrection"]) {
        expect(parameter(name)?.required ?? false).toBe(false);
        expect(parameter(name)?.description).toEqual(expect.any(String));
      }
    });

    it("answers with an SVG or PNG file named in the Content-Disposition header", () => {
      const ok = carrierOperation()?.responses?.["200"];

      expect(Object.keys(ok?.content ?? {}).sort()).toEqual(
        Object.values(CARRIER_EXPORT_CONTENT_TYPES).sort(),
      );
      for (const media of Object.values(ok?.content ?? {}) as { schema?: unknown }[]) {
        expect(media.schema).toEqual({ type: "string", format: "binary" });
      }
      expect(ok?.headers).toHaveProperty("Content-Disposition");
    });

    it("documents the invalid-settings, forbidden, not-found and rate-limit responses", () => {
      const responses = carrierOperation()?.responses ?? {};

      for (const status of ["400", "403", "404", "429"]) {
        expect(responses[status]?.description).toEqual(expect.any(String));
      }
    });
  });
});
