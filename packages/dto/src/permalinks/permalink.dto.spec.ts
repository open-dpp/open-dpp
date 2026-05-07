import { describe, expect, it } from "@jest/globals";
import { PassportPermalinkBundleDtoSchema } from "./permalink.dto";

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
});
