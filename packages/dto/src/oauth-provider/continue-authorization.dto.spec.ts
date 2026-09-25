import { expect } from "@jest/globals";
import {
  ContinueAuthorizationDtoSchema,
  ContinueAuthorizationResponseDtoSchema,
} from "./continue-authorization.dto";

describe("ContinueAuthorizationDtoSchema", () => {
  it("parses the signed authorize query", () => {
    const parsed = ContinueAuthorizationDtoSchema.parse({
      oauthQuery: "client_id=landing-page&prompt=create&exp=1&sig=abc",
    });
    expect(parsed.oauthQuery).toBe("client_id=landing-page&prompt=create&exp=1&sig=abc");
  });

  it.each([
    ["a missing query", {}],
    ["an empty query", { oauthQuery: "" }],
    ["an oversized query", { oauthQuery: "a".repeat(8193) }],
  ])("rejects %s", (_label: string, body: object) => {
    expect(() => ContinueAuthorizationDtoSchema.parse(body)).toThrow();
  });
});

describe("ContinueAuthorizationResponseDtoSchema", () => {
  it("parses the Trusted Client redirect", () => {
    const parsed = ContinueAuthorizationResponseDtoSchema.parse({
      url: "https://landing.example.com/auth/callback?code=c&state=s",
    });
    expect(parsed.url).toBe("https://landing.example.com/auth/callback?code=c&state=s");
  });

  it("rejects a response without a URL", () => {
    expect(() => ContinueAuthorizationResponseDtoSchema.parse({})).toThrow();
  });
});
