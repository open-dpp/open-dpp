import { expect } from "@jest/globals";
import { RequestEmailChangeDtoSchema } from "./request-email-change.dto";

describe("requestEmailChangeDto", () => {
  it("accepts a valid email", () => {
    const result = RequestEmailChangeDtoSchema.safeParse({ newEmail: "jane@example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects a malformed email", () => {
    const result = RequestEmailChangeDtoSchema.safeParse({ newEmail: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty string", () => {
    const result = RequestEmailChangeDtoSchema.safeParse({ newEmail: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing newEmail field", () => {
    const result = RequestEmailChangeDtoSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
