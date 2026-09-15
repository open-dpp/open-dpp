import { describe, expect, it } from "@jest/globals";
import {
  OrganizationCreateDtoSchema,
  OrganizationCreateResponseDtoSchema,
  OrganizationDtoSchema,
  OrganizationOwnerDtoSchema,
  ProvisioningDtoSchema,
} from "./organization.dto";

const validOrganization = {
  id: "690cf22459cdae7ce188c1f8",
  name: "ACME GmbH",
  logo: "https://example.com/logo.png",
  metadata: { reference: "mollie:tr_123" },
  createdAt: "2026-09-14T10:00:00.000Z",
};

const validProvisioning = {
  owner: { id: "user-1", email: "jane@example.com", created: true },
  emailSent: true,
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

  it("ignores provided metadata", () => {
    expect(
      OrganizationCreateDtoSchema.parse({ name: "ACME GmbH", metadata: { reference: "x" } }),
    ).toEqual({ name: "ACME GmbH" });
  });

  it.each(["", "   "])("rejects the name %j", (name) => {
    expect(() => OrganizationCreateDtoSchema.parse({ name })).toThrow();
  });

  it("rejects a missing name", () => {
    expect(() => OrganizationCreateDtoSchema.parse({})).toThrow();
  });

  it("accepts an owner and lowercases its email", () => {
    const parsed = OrganizationCreateDtoSchema.parse({
      name: "ACME GmbH",
      owner: {
        email: "Jane.Doe@Example.COM",
        firstName: " Jane ",
        lastName: " Doe ",
        locale: "de",
      },
    });
    expect(parsed.owner).toEqual({
      email: "jane.doe@example.com",
      firstName: "Jane",
      lastName: "Doe",
      locale: "de",
    });
  });

  it("accepts an owner with email and locale only", () => {
    const parsed = OrganizationCreateDtoSchema.parse({
      name: "ACME GmbH",
      owner: { email: "jane@example.com", locale: "en" },
    });
    expect(parsed.owner).toEqual({ email: "jane@example.com", locale: "en" });
  });

  it("defaults the owner locale to en", () => {
    const parsed = OrganizationCreateDtoSchema.parse({
      name: "ACME GmbH",
      owner: { email: "jane@example.com" },
    });
    expect(parsed.owner?.locale).toBe("en");
  });

  it.each(["fr", "", "de-DE"])("rejects the owner locale %j", (locale) => {
    expect(() =>
      OrganizationCreateDtoSchema.parse({
        name: "ACME GmbH",
        owner: { email: "jane@example.com", locale },
      }),
    ).toThrow();
  });

  it("rejects an owner without a valid email", () => {
    expect(() =>
      OrganizationCreateDtoSchema.parse({
        name: "ACME GmbH",
        owner: { email: "nope", locale: "en" },
      }),
    ).toThrow();
    expect(() =>
      OrganizationCreateDtoSchema.parse({ name: "ACME GmbH", owner: { locale: "en" } }),
    ).toThrow();
  });

  it("rejects owner names longer than 100 characters", () => {
    expect(() =>
      OrganizationOwnerDtoSchema.parse({
        email: "jane@example.com",
        firstName: "a".repeat(101),
        locale: "en",
      }),
    ).toThrow();
  });
});

describe("ProvisioningDtoSchema", () => {
  it("parses a provisioning result", () => {
    expect(ProvisioningDtoSchema.parse(validProvisioning)).toEqual(validProvisioning);
  });

  it("rejects a missing created flag", () => {
    const { created: _created, ...owner } = validProvisioning.owner;
    expect(() => ProvisioningDtoSchema.parse({ ...validProvisioning, owner })).toThrow();
  });
});

describe("OrganizationCreateResponseDtoSchema", () => {
  it("parses a plain organization without provisioning", () => {
    const parsed = OrganizationCreateResponseDtoSchema.parse(validOrganization);
    expect(parsed).toEqual(validOrganization);
    expect(parsed).not.toHaveProperty("provisioning");
  });

  it("parses an organization with provisioning", () => {
    const parsed = OrganizationCreateResponseDtoSchema.parse({
      ...validOrganization,
      provisioning: validProvisioning,
    });
    expect(parsed.provisioning).toEqual(validProvisioning);
  });
});
