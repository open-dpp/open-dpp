import { describe, expect, it } from "@jest/globals";
import {
  LEGACY_PERMALINK_KIND,
  PassportPermalinkBundleDtoSchema,
  PermalinkDtoSchema,
  PermalinkInvariantsSchema,
  PermalinkKind,
  PermalinkKindSchema,
  PermalinkPaginationDtoSchema,
  PermalinkPublishedUrlSchema,
  PermalinkPublicDtoSchema,
} from "./permalink.dto";

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

  it("accepts presentationConfiguration: null (standard view, no customization)", () => {
    const result = PassportPermalinkBundleDtoSchema.safeParse({
      ...validBundle,
      presentationConfiguration: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.presentationConfiguration).toBeNull();
    }
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
  passportId,
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

  it("accepts a fallbackBaseUrl that includes a path", () => {
    const result = PermalinkPublicDtoSchema.safeParse({
      ...validPublic,
      fallbackBaseUrl: "https://branding.example.com/p",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when fallbackBaseUrl includes a query string", () => {
    const result = PermalinkPublicDtoSchema.safeParse({
      ...validPublic,
      fallbackBaseUrl: "https://branding.example.com?q=1",
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

describe("PermalinkPublishedUrlSchema", () => {
  it("accepts a full URL that includes the /p/ path", () => {
    const result = PermalinkPublishedUrlSchema.safeParse(
      "https://passports.example.com/p/acme-widget",
    );
    expect(result.success).toBe(true);
  });

  it("accepts a full URL whose path segment is a uuid", () => {
    const result = PermalinkPublishedUrlSchema.safeParse(
      `https://passports.example.com/p/${permalinkId}`,
    );
    expect(result.success).toBe(true);
  });

  it("rejects a non-URL string", () => {
    expect(PermalinkPublishedUrlSchema.safeParse("not-a-url").success).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(PermalinkPublishedUrlSchema.safeParse("").success).toBe(false);
  });
});

describe("PermalinkDtoSchema publishedUrl", () => {
  const validPermalink = {
    id: permalinkId,
    passportId,
    slug: "acme-widget",
    baseUrl: null,
    presentationConfigurationId: configId,
    createdAt: isoNow,
    updatedAt: isoNow,
  };

  it("parses a permalink without publishedUrl (draft, never published)", () => {
    const result = PermalinkDtoSchema.safeParse(validPermalink);
    expect(result.success).toBe(true);
  });

  it("parses a permalink with a frozen publishedUrl", () => {
    const result = PermalinkDtoSchema.safeParse({
      ...validPermalink,
      publishedUrl: "https://passports.example.com/p/acme-widget",
    });
    expect(result.success).toBe(true);
  });

  it("accepts publishedUrl = null", () => {
    const result = PermalinkDtoSchema.safeParse({ ...validPermalink, publishedUrl: null });
    expect(result.success).toBe(true);
  });

  it("rejects a publishedUrl that is not a URL", () => {
    const result = PermalinkDtoSchema.safeParse({
      ...validPermalink,
      publishedUrl: "nope",
    });
    expect(result.success).toBe(false);
  });
});

// UUIDs used in the polymorphism tests
const upiId = "55555555-5555-4555-8555-555555555555";

describe("PermalinkKind", () => {
  it("exposes OPEN_DPP and GS1_LINK constants", () => {
    expect(PermalinkKind.OPEN_DPP).toBe("open-dpp");
    expect(PermalinkKind.GS1_LINK).toBe("gs1-link");
  });

  it("exposes the legacy wire value for on-read migration", () => {
    expect(LEGACY_PERMALINK_KIND).toBe("presentation");
  });

  it("PermalinkKindSchema accepts 'open-dpp' and 'gs1-link'", () => {
    expect(PermalinkKindSchema.safeParse("open-dpp").success).toBe(true);
    expect(PermalinkKindSchema.safeParse("gs1-link").success).toBe(true);
  });

  it("PermalinkKindSchema rejects the legacy 'presentation' value (mapped upstream)", () => {
    expect(PermalinkKindSchema.safeParse("presentation").success).toBe(false);
  });

  it("PermalinkKindSchema rejects unknown values", () => {
    expect(PermalinkKindSchema.safeParse("other").success).toBe(false);
    expect(PermalinkKindSchema.safeParse("").success).toBe(false);
  });
});

describe("PermalinkDtoSchema polymorphism", () => {
  const base = {
    id: permalinkId,
    passportId,
    slug: "acme-widget",
    baseUrl: null,
    publishedUrl: null,
    createdAt: isoNow,
    updatedAt: isoNow,
  };

  it("parses a bare open-dpp permalink (no config, no UPI)", () => {
    const result = PermalinkDtoSchema.safeParse({
      ...base,
      kind: "open-dpp",
      presentationConfigurationId: null,
      uniqueProductIdentifierId: null,
      gs1DataAttributes: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.kind).toBe("open-dpp");
      expect(result.data.passportId).toBe(passportId);
      expect(result.data.presentationConfigurationId).toBeNull();
      expect(result.data.uniqueProductIdentifierId).toBeNull();
    }
  });

  it("parses an open-dpp permalink bound to a UPI", () => {
    const result = PermalinkDtoSchema.safeParse({
      ...base,
      kind: "open-dpp",
      presentationConfigurationId: null,
      uniqueProductIdentifierId: upiId,
      gs1DataAttributes: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.uniqueProductIdentifierId).toBe(upiId);
    }
  });

  it("parses an open-dpp permalink bound to a config and a UPI", () => {
    const result = PermalinkDtoSchema.safeParse({
      ...base,
      kind: "open-dpp",
      presentationConfigurationId: configId,
      uniqueProductIdentifierId: upiId,
      gs1DataAttributes: null,
    });
    expect(result.success).toBe(true);
  });

  it("parses a gs1-link permalink", () => {
    const result = PermalinkDtoSchema.safeParse({
      ...base,
      kind: "gs1-link",
      presentationConfigurationId: null,
      uniqueProductIdentifierId: upiId,
      gs1DataAttributes: { "17": "251231" },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.kind).toBe("gs1-link");
      expect(result.data.uniqueProductIdentifierId).toBe(upiId);
      expect(result.data.gs1DataAttributes).toEqual({ "17": "251231" });
    }
  });

  it("rejects an unknown kind", () => {
    const result = PermalinkDtoSchema.safeParse({
      ...base,
      kind: "unknown-kind",
      presentationConfigurationId: configId,
      uniqueProductIdentifierId: null,
      gs1DataAttributes: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects the legacy 'presentation' kind (backend maps it before dto parse)", () => {
    const result = PermalinkDtoSchema.safeParse({
      ...base,
      kind: "presentation",
      presentationConfigurationId: configId,
      uniqueProductIdentifierId: null,
      gs1DataAttributes: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a gs1-link with uniqueProductIdentifierId: null", () => {
    const result = PermalinkDtoSchema.safeParse({
      ...base,
      kind: "gs1-link",
      presentationConfigurationId: null,
      uniqueProductIdentifierId: null,
      gs1DataAttributes: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an open-dpp permalink with non-null gs1DataAttributes", () => {
    const result = PermalinkDtoSchema.safeParse({
      ...base,
      kind: "open-dpp",
      presentationConfigurationId: configId,
      uniqueProductIdentifierId: null,
      gs1DataAttributes: { "17": "251231" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects a permalink without passportId", () => {
    const { passportId: _passportId, ...rest } = base;
    const result = PermalinkDtoSchema.safeParse({
      ...rest,
      kind: "open-dpp",
      presentationConfigurationId: configId,
      uniqueProductIdentifierId: null,
      gs1DataAttributes: null,
    });
    expect(result.success).toBe(false);
  });

  it("defaults kind to 'open-dpp' when missing", () => {
    const result = PermalinkDtoSchema.safeParse({
      ...base,
      presentationConfigurationId: configId,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.kind).toBe("open-dpp");
      expect(result.data.uniqueProductIdentifierId).toBeNull();
      expect(result.data.gs1DataAttributes).toBeNull();
    }
  });

  it("strips the removed 'primary' field from legacy docs", () => {
    const result = PermalinkDtoSchema.safeParse({
      ...base,
      kind: "open-dpp",
      presentationConfigurationId: configId,
      uniqueProductIdentifierId: null,
      gs1DataAttributes: null,
      primary: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(Object.prototype.hasOwnProperty.call(result.data, "primary")).toBe(false);
    }
  });

  it("PermalinkDtoSchema is still a ZodObject (has .extend method)", () => {
    expect(typeof (PermalinkDtoSchema as { extend?: unknown }).extend).toBe("function");
  });
});

describe("PermalinkInvariantsSchema", () => {
  it("accepts a bare open-dpp create (passportId only)", () => {
    const result = PermalinkInvariantsSchema.safeParse({
      kind: "open-dpp",
      passportId,
    });
    expect(result.success).toBe(true);
  });

  it("accepts an open-dpp create with config, UPI, and slug", () => {
    const result = PermalinkInvariantsSchema.safeParse({
      kind: "open-dpp",
      passportId,
      presentationConfigurationId: configId,
      uniqueProductIdentifierId: upiId,
      slug: "my-product",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an open-dpp create without passportId", () => {
    const result = PermalinkInvariantsSchema.safeParse({
      kind: "open-dpp",
      presentationConfigurationId: configId,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an open-dpp create with gs1DataAttributes", () => {
    const result = PermalinkInvariantsSchema.safeParse({
      kind: "open-dpp",
      passportId,
      gs1DataAttributes: { "17": "251231" },
    });
    expect(result.success).toBe(false);
  });

  it("accepts a gs1-link with uniqueProductIdentifierId and null optional fields", () => {
    const result = PermalinkInvariantsSchema.safeParse({
      kind: "gs1-link",
      passportId,
      uniqueProductIdentifierId: upiId,
      presentationConfigurationId: null,
      gs1DataAttributes: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a gs1-link that also sets presentationConfigurationId", () => {
    const result = PermalinkInvariantsSchema.safeParse({
      kind: "gs1-link",
      passportId,
      uniqueProductIdentifierId: upiId,
      presentationConfigurationId: configId,
      gs1DataAttributes: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a gs1-link without uniqueProductIdentifierId", () => {
    const result = PermalinkInvariantsSchema.safeParse({
      kind: "gs1-link",
      passportId,
      presentationConfigurationId: null,
      gs1DataAttributes: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a gs1-link without passportId", () => {
    const result = PermalinkInvariantsSchema.safeParse({
      kind: "gs1-link",
      uniqueProductIdentifierId: upiId,
      presentationConfigurationId: null,
    });
    expect(result.success).toBe(false);
  });
});

import { PermalinkCreateRequestSchema, PermalinkUpdateRequestSchema } from "./permalink.dto";

describe("PermalinkCreateRequestSchema", () => {
  it("parses a bare open-dpp create request (passportId only)", () => {
    const result = PermalinkCreateRequestSchema.safeParse({
      kind: "open-dpp",
      passportId,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.kind).toBe("open-dpp");
    }
  });

  it("parses an open-dpp create request with config, UPI, slug, and baseUrl", () => {
    const result = PermalinkCreateRequestSchema.safeParse({
      kind: "open-dpp",
      passportId,
      presentationConfigurationId: configId,
      uniqueProductIdentifierId: upiId,
      slug: "my-product",
      baseUrl: "https://passports.example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an open-dpp create request without passportId", () => {
    const result = PermalinkCreateRequestSchema.safeParse({
      kind: "open-dpp",
      presentationConfigurationId: configId,
    });
    expect(result.success).toBe(false);
  });

  it("rejects the legacy 'presentation' kind in create requests", () => {
    const result = PermalinkCreateRequestSchema.safeParse({
      kind: "presentation",
      presentationConfigurationId: configId,
    });
    expect(result.success).toBe(false);
  });

  it("parses a gs1-link create request with passportId and uniqueProductIdentifierId", () => {
    const result = PermalinkCreateRequestSchema.safeParse({
      kind: "gs1-link",
      passportId,
      uniqueProductIdentifierId: upiId,
      presentationConfigurationId: null,
      gs1DataAttributes: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.kind).toBe("gs1-link");
    }
  });

  it("parses a gs1-link create request with optional presentationConfigurationId, gs1DataAttributes, and slug", () => {
    const result = PermalinkCreateRequestSchema.safeParse({
      kind: "gs1-link",
      passportId,
      uniqueProductIdentifierId: upiId,
      presentationConfigurationId: configId,
      gs1DataAttributes: { "17": "251231" },
      slug: "my-gs1-product",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a gs1-link create request without uniqueProductIdentifierId", () => {
    const result = PermalinkCreateRequestSchema.safeParse({
      kind: "gs1-link",
      passportId,
      presentationConfigurationId: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a gs1-link create request without passportId", () => {
    const result = PermalinkCreateRequestSchema.safeParse({
      kind: "gs1-link",
      uniqueProductIdentifierId: upiId,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an open-dpp create request with gs1DataAttributes", () => {
    const result = PermalinkCreateRequestSchema.safeParse({
      kind: "open-dpp",
      passportId,
      gs1DataAttributes: { "17": "251231" },
    } as Record<string, unknown>);
    expect(result.success).toBe(false);
  });
});

describe("PermalinkUpdateRequestSchema", () => {
  it("still accepts slug and baseUrl", () => {
    const result = PermalinkUpdateRequestSchema.safeParse({
      slug: "updated-slug",
      baseUrl: "https://passports.example.com",
    });
    expect(result.success).toBe(true);
  });

  it("strips the removed 'primary' field", () => {
    const result = PermalinkUpdateRequestSchema.safeParse({ primary: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(Object.prototype.hasOwnProperty.call(result.data, "primary")).toBe(false);
    }
  });

  it("accepts gs1DataAttributes", () => {
    const result = PermalinkUpdateRequestSchema.safeParse({
      gs1DataAttributes: { "17": "251231" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts presentationConfigurationId as a uuid", () => {
    const result = PermalinkUpdateRequestSchema.safeParse({
      presentationConfigurationId: configId,
    });
    expect(result.success).toBe(true);
  });

  it("accepts presentationConfigurationId as null (rebind to standard view)", () => {
    const result = PermalinkUpdateRequestSchema.safeParse({
      presentationConfigurationId: null,
    });
    expect(result.success).toBe(true);
  });

  it("strips kind if provided (does not accept changing kind)", () => {
    const result = PermalinkUpdateRequestSchema.safeParse({
      kind: "gs1-link",
      slug: "test-slug",
    } as Record<string, unknown>);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(Object.prototype.hasOwnProperty.call(result.data, "kind")).toBe(false);
    }
  });
});

describe("PermalinkPaginationDtoSchema", () => {
  const validPermalinkPublic = {
    id: "44444444-4444-4444-8444-444444444444",
    kind: "open-dpp",
    passportId,
    slug: null,
    baseUrl: null,
    publishedUrl: null,
    presentationConfigurationId: configId,
    uniqueProductIdentifierId: null,
    gs1DataAttributes: null,
    createdAt: isoNow,
    updatedAt: isoNow,
    publicUrl: "https://passports.example.com/44444444-4444-4444-8444-444444444444",
    fallbackBaseUrl: "https://passports.example.com",
    fallbackBaseUrlSource: "instance",
  };

  it("parses an envelope with a non-null cursor and a result array", () => {
    const result = PermalinkPaginationDtoSchema.parse({
      paging_metadata: { cursor: "cursor-token" },
      result: [validPermalinkPublic],
    });
    expect(result.paging_metadata.cursor).toBe("cursor-token");
    expect(result.result).toHaveLength(1);
    expect(result.result[0].id).toBe(validPermalinkPublic.id);
  });

  it("parses an envelope with a null cursor and an empty result", () => {
    const result = PermalinkPaginationDtoSchema.parse({
      paging_metadata: { cursor: null },
      result: [],
    });
    expect(result.paging_metadata.cursor).toBeNull();
    expect(result.result).toEqual([]);
  });

  it("rejects an envelope missing paging_metadata", () => {
    expect(() => PermalinkPaginationDtoSchema.parse({ result: [] })).toThrow();
  });
});
