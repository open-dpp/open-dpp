/** API contract: the instance publishes a machine-readable description of its API. */
import { EnvConfig } from "../config";
import { newAnonymousContext } from "../helpers/anonymous";
import { check, expect } from "./checks";

check(
  {
    id: "api.openapi-document-served",
    title: "the instance serves an OpenAPI 3.1 document that describes the AAS submodel routes",
    criteria: ["ESPR-Art10(1)(d)", "BATT-Art77(5)", "CPR-Art77(1)(d)"],
  },
  async ({ browser }) => {
    const anonymous = await newAnonymousContext(browser);
    // SwaggerModule serves the JSON document at the root (jsonDocumentUrl "api.json"), the UI under /api.
    const response = await anonymous.request.get(`${EnvConfig.OPEN_DPP_URL}/api.json`);
    expect(response.status(), "OpenAPI document (OPEN_DPP_BUILD_API_DOC)").toBe(200);
    const doc = (await response.json()) as { openapi?: string; paths?: Record<string, unknown> };
    expect(doc.openapi).toMatch(/^3\.1/);
    const paths = Object.keys(doc.paths ?? {});
    expect(paths.some((p) => p.includes("/submodels"))).toBe(true);
    expect(paths.some((p) => p.includes("/unique-product-identifiers"))).toBe(true);
    await anonymous.close();
  },
);
