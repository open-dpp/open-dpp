import { describe, expect, it } from "vitest";
import { buildOpenApiDocumentation } from "./index";

describe("userPaths", () => {
  const document = buildOpenApiDocumentation();

  it.each(["/users/me/resend-verification-email", "/users/{id}/resend-verification-email"])(
    "documents %s",
    (path) => {
      expect(document.paths?.[path]).toHaveProperty("post");
    },
  );
});
