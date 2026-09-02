import { ValueError } from "@open-dpp/exception";
import { Limit } from "./limit";
import { PolicyKeyList } from "./policy-rules";

describe("limit", () => {
  const limit = Limit.loadFromDb({
    key: PolicyKeyList.MEDIA_STORAGE_LIMIT,
    organizationId: "org1",
    limit: 100,
  });

  it("returns a new limit carrying the new cap", () => {
    const updated = limit.withLimit(250);

    expect(updated.getLimit()).toBe(250);
    expect(updated.getKey()).toBe(PolicyKeyList.MEDIA_STORAGE_LIMIT);
    expect(updated.getOrganizationId()).toBe("org1");
  });

  it("leaves the original untouched", () => {
    limit.withLimit(250);

    expect(limit.getLimit()).toBe(100);
  });

  it("allows 0, which means unlimited", () => {
    expect(limit.withLimit(0).getLimit()).toBe(0);
  });

  it("rejects a negative cap", () => {
    expect(() => limit.withLimit(-1)).toThrow(ValueError);
  });

  it("rejects a fractional cap", () => {
    expect(() => limit.withLimit(1.5)).toThrow(ValueError);
  });
});
