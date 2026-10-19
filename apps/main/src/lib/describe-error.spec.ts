import { describe, expect, it } from "@jest/globals";

import { describeError } from "./describe-error";

describe("describeError", () => {
  it("names an Error by its class and message", () => {
    expect(describeError(new TypeError("boom"))).toBe("TypeError: boom");
  });

  it("stringifies anything else that was thrown", () => {
    expect(describeError("plain string")).toBe("plain string");
    expect(describeError(42)).toBe("42");
    expect(describeError(undefined)).toBe("undefined");
  });
});
