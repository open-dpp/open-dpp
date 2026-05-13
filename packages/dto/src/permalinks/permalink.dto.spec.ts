import { describe, expect, it } from "@jest/globals";
import { PassportPermalinkBundleDtoSchema, PermalinkPublicDtoSchema } from "./permalink.dto";

const isoNow = "2026-05-06T20:56:00.000Z";

const passportId = "11111111-1111-4111-8111-111111111111";
const organizationId = "22222222-2222-4222-8222-222222222222";
const configId = "33333333-3333-4333-8333-333333333333";

const validBundle = {
  passport: {
    id: passportId,
    organizationId,
    templateId: null,
    environment: {
      assetAdministrationShells: [],
      submodels: [],
      conceptDescriptions: [],
    },
    createdAt: isoNow,
    updatedAt: isoNow,
    lastStatusChange: {
      previousStatus: null,
      currentStatus: "Published",
    },
  },
  branding: {
    logo: null,
    primaryColor: null,
    permalinkBaseUrl: null,
  },
  presentationConfiguration: {
    id: configId,
    organizationId,
    referenceId: passportId,
    referenceType: "passport",
    label: null,
    elementDesign: {},
    defaultComponents: {},
    createdAt: isoNow,
    updatedAt: isoNow,
  },
  publicUrl: "https://passports.example.com/p/11111111-1111-4111-8111-111111111111",
};

describe("PassportPermalinkBundleDtoSchema", () => {
  it("parses a complete bundle", () => {
    const result = PassportPermalinkBundleDtoSchema.safeParse(validBundle);
    expect(result.success).toBe(true);
  });

  it("rejects a bundle missing the branding key", () => {
    const { branding: _branding, ...rest } = validBundle;
    const result = PassportPermalinkBundleDtoSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects a bundle missing the presentationConfiguration key", () => {
    const { presentationConfiguration: _config, ...rest } = validBundle;
    const result = PassportPermalinkBundleDtoSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects a bundle missing the passport key", () => {
    const { passport: _passport, ...rest } = validBundle;
    const result = PassportPermalinkBundleDtoSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects a bundle missing the publicUrl key", () => {
    const { publicUrl: _publicUrl, ...rest } = validBundle;
    const result = PassportPermalinkBundleDtoSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

const permalinkId = "44444444-4444-4444-8444-444444444444";

const validPublic = {
  id: permalinkId,
  slug: "acme-widget",
  baseUrl: "https://override.example.com",
  presentationConfigurationId: configId,
  createdAt: isoNow,
  updatedAt: isoNow,
  publicUrl: "https://override.example.com/p/acme-widget",
  fallbackBaseUrl: "https://branding.example.com",
  fallbackBaseUrlSource: "branding",
};

describe("PermalinkPublicDtoSchema", () => {
  it("parses a complete public DTO", () => {
    const result = PermalinkPublicDtoSchema.safeParse(validPublic);
    expect(result.success).toBe(true);
  });

  it("rejects when fallbackBaseUrl is missing", () => {
    const { fallbackBaseUrl: _fallback, ...rest } = validPublic;
    const result = PermalinkPublicDtoSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects when fallbackBaseUrl is not a valid origin", () => {
    const result = PermalinkPublicDtoSchema.safeParse({
      ...validPublic,
      fallbackBaseUrl: "https://branding.example.com/with-path",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when fallbackBaseUrlSource is missing", () => {
    const { fallbackBaseUrlSource: _source, ...rest } = validPublic;
    const result = PermalinkPublicDtoSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects when fallbackBaseUrlSource is an unknown value", () => {
    const result = PermalinkPublicDtoSchema.safeParse({
      ...validPublic,
      fallbackBaseUrlSource: "permalink",
    });
    expect(result.success).toBe(false);
  });

  it("accepts fallbackBaseUrlSource = 'instance'", () => {
    const result = PermalinkPublicDtoSchema.safeParse({
      ...validPublic,
      fallbackBaseUrlSource: "instance",
    });
    expect(result.success).toBe(true);
  });
});
