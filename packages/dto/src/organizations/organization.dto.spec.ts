import { describe, expect, it } from "@jest/globals";
import { OrganizationCreateDtoSchema, OrganizationDtoSchema } from "./organization.dto";

const validOrganization = {
  id: "690cf22459cdae7ce188c1f8",
  name: "ACME GmbH",
  logo: "https://example.com/logo.png",
  metadata: { reference: "mollie:tr_123" },
  createdAt: "2026-09-14T10:00:00.000Z",
};

describe("OrganizationDtoSchema", () => {
  it("parses a full organization", () => {
    expect(OrganizationDtoSchema.parse(validOrganization)).toEqual(validOrganization);
  });

  it("accepts a null or missing logo", () => {
    expect(OrganizationDtoSchema.parse({ ...validOrganization, logo: null }).logo).toBeNull();
    const { logo: _logo, ...withoutLogo } = validOrganization;
    expect(OrganizationDtoSchema.parse(withoutLogo).logo).toBeUndefined();
  });

  it("strips slug and members from a response", () => {
    const parsed = OrganizationDtoSchema.parse({
      ...validOrganization,
      slug: validOrganization.id,
      members: [],
    });
    expect(parsed).toEqual(validOrganization);
    expect(parsed).not.toHaveProperty("slug");
    expect(parsed).not.toHaveProperty("members");
  });

  it("rejects a missing id", () => {
    const { id: _id, ...rest } = validOrganization;
    expect(() => OrganizationDtoSchema.parse(rest)).toThrow();
  });
});

describe("OrganizationCreateDtoSchema", () => {
  it("accepts a name and trims it", () => {
    expect(OrganizationCreateDtoSchema.parse({ name: "  ACME GmbH  " })).toEqual({
      name: "ACME GmbH",
    });
  });

  it("ignores a provided slug", () => {
    expect(OrganizationCreateDtoSchema.parse({ name: "ACME GmbH", slug: "acme" })).toEqual({
      name: "ACME GmbH",
    });
  });

  it.each(["", "   "])("rejects the name %j", (name) => {
    expect(() => OrganizationCreateDtoSchema.parse({ name })).toThrow();
  });

  it("rejects a missing name", () => {
    expect(() => OrganizationCreateDtoSchema.parse({})).toThrow();
  });
});
