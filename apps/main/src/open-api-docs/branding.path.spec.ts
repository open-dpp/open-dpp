import { brandingPaths } from "./branding.path";
import { ContentType } from "./content.types";
import { HTTPCode } from "./http.codes";

describe("brandingPaths", () => {
  describe("GET /branding/logo/{mediaId}", () => {
    const getOp = brandingPaths["/branding/logo/{mediaId}"].get;

    it("documents the successful image response", () => {
      expect(getOp.responses).toHaveProperty(String(HTTPCode.OK));
    });

    it("documents the 404 JSON error body returned when the logo is not found", () => {
      const notFound = getOp.responses[HTTPCode.NOT_FOUND];
      expect(notFound).toBeDefined();
      expect(notFound.description).toEqual(expect.any(String));
      expect(notFound.content[ContentType.JSON].schema).toEqual({
        type: "object",
        properties: {
          error: { type: "string", example: "Logo not found" },
        },
        required: ["error"],
      });
    });
  });
});
