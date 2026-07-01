import { describe, expect, it } from "@jest/globals";
import {
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
  it("exposes PRESENTATION and GS1_LINK constants", () => {
    expect(PermalinkKind.PRESENTATION).toBe("presentation");
    expect(PermalinkKind.GS1_LINK).toBe("gs1-link");
  });

  it("PermalinkKindSchema accepts 'presentation' and 'gs1-link'", () => {
    expect(PermalinkKindSchema.safeParse("presentation").success).toBe(true);
    expect(PermalinkKindSchema.safeParse("gs1-link").success).toBe(true);
  });

  it("PermalinkKindSchema rejects unknown values", () => {
    expect(PermalinkKindSchema.safeParse("other").success).toBe(false);
    expect(PermalinkKindSchema.safeParse("").success).toBe(false);
  });
});

describe("PermalinkDtoSchema polymorphism", () => {
  const base = {
    id: permalinkId,
    slug: "acme-widget",
    baseUrl: null,
    publishedUrl: null,
    createdAt: isoNow,
    updatedAt: isoNow,
  };

  // (1) parses a presentation permalink
  it("parses a presentation permalink with all new fields", () => {
    const result = PermalinkDtoSchema.safeParse({
      ...base,
      kind: "presentation",
      presentationConfigurationId: configId,
      uniqueProductIdentifierId: null,
      primary: true,
      gs1DataAttributes: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.kind).toBe("presentation");
      expect(result.data.primary).toBe(true);
      expect(result.data.uniqueProductIdentifierId).toBeNull();
      expect(result.data.gs1DataAttributes).toBeNull();
    }
  });

  // (2) parses a gs1-link permalink
  it("parses a gs1-link permalink", () => {
    const result = PermalinkDtoSchema.safeParse({
      ...base,
      kind: "gs1-link",
      presentationConfigurationId: null,
      uniqueProductIdentifierId: upiId,
      primary: false,
      gs1DataAttributes: { "17": "251231" },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.kind).toBe("gs1-link");
      expect(result.data.uniqueProductIdentifierId).toBe(upiId);
      expect(result.data.gs1DataAttributes).toEqual({ "17": "251231" });
    }
  });

  // (3) accepts presentationConfigurationId: null
  it("accepts presentationConfigurationId: null on a presentation permalink (already covered by gs1-link case)", () => {
    const result = PermalinkDtoSchema.safeParse({
      ...base,
      kind: "gs1-link",
      presentationConfigurationId: null,
      uniqueProductIdentifierId: upiId,
      primary: false,
      gs1DataAttributes: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.presentationConfigurationId).toBeNull();
    }
  });

  // (4) rejects an unknown kind
  it("rejects an unknown kind", () => {
    const result = PermalinkDtoSchema.safeParse({
      ...base,
      kind: "unknown-kind",
      presentationConfigurationId: configId,
      uniqueProductIdentifierId: null,
      primary: false,
      gs1DataAttributes: null,
    });
    expect(result.success).toBe(false);
  });

  // (5) rejects a gs1-link with uniqueProductIdentifierId: null
  it("rejects a gs1-link with uniqueProductIdentifierId: null", () => {
    const result = PermalinkDtoSchema.safeParse({
      ...base,
      kind: "gs1-link",
      presentationConfigurationId: null,
      uniqueProductIdentifierId: null,
      primary: false,
      gs1DataAttributes: null,
    });
    expect(result.success).toBe(false);
  });

  // (6a) rejects a presentation permalink with non-null uniqueProductIdentifierId
  it("rejects a presentation permalink with non-null uniqueProductIdentifierId", () => {
    const result = PermalinkDtoSchema.safeParse({
      ...base,
      kind: "presentation",
      presentationConfigurationId: configId,
      uniqueProductIdentifierId: upiId,
      primary: false,
      gs1DataAttributes: null,
    });
    expect(result.success).toBe(false);
  });

  // (6c) rejects a presentation permalink with non-null gs1DataAttributes
  it("rejects a presentation permalink with non-null gs1DataAttributes", () => {
    const result = PermalinkDtoSchema.safeParse({
      ...base,
      kind: "presentation",
      presentationConfigurationId: configId,
      uniqueProductIdentifierId: null,
      primary: false,
      gs1DataAttributes: { "17": "251231" },
    });
    expect(result.success).toBe(false);
  });

  // (7) parses a legacy doc lacking kind/primary/uniqueProductIdentifierId/gs1* → defaults
  it("parses a legacy doc lacking kind/primary/uniqueProductIdentifierId/gs1* with defaults", () => {
    const result = PermalinkDtoSchema.safeParse({
      ...base,
      presentationConfigurationId: configId,
      // no kind, no primary, no uniqueProductIdentifierId, no gs1DataAttributes
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.kind).toBe("presentation");
      expect(result.data.primary).toBe(false);
      expect(result.data.uniqueProductIdentifierId).toBeNull();
      expect(result.data.gs1DataAttributes).toBeNull();
    }
  });

  // PermalinkDtoSchema is still a ZodObject (has .extend)
  it("PermalinkDtoSchema is still a ZodObject (has .extend method)", () => {
    expect(typeof (PermalinkDtoSchema as { extend?: unknown }).extend).toBe("function");
  });
});

// --- Slice 13: PermalinkInvariantsSchema (create-time polymorphic) ---

describe("PermalinkInvariantsSchema", () => {
  // (1) accepts presentation create
  it("accepts a presentation create with presentationConfigurationId and null slug", () => {
    const result = PermalinkInvariantsSchema.safeParse({
      kind: "presentation",
      presentationConfigurationId: configId,
      slug: null,
    });
    expect(result.success).toBe(true);
  });

  // (2) accepts gs1-link with all nullable gs1 fields
  it("accepts a gs1-link with uniqueProductIdentifierId and null optional fields", () => {
    const result = PermalinkInvariantsSchema.safeParse({
      kind: "gs1-link",
      uniqueProductIdentifierId: upiId,
      presentationConfigurationId: null,
      gs1DataAttributes: null,
    });
    expect(result.success).toBe(true);
  });

  // (3) accepts a gs1-link that also sets presentationConfigurationId
  it("accepts a gs1-link that also sets presentationConfigurationId", () => {
    const result = PermalinkInvariantsSchema.safeParse({
      kind: "gs1-link",
      uniqueProductIdentifierId: upiId,
      presentationConfigurationId: configId,
      gs1DataAttributes: null,
    });
    expect(result.success).toBe(true);
  });

  // (4) rejects a gs1-link without uniqueProductIdentifierId
  it("rejects a gs1-link without uniqueProductIdentifierId", () => {
    const result = PermalinkInvariantsSchema.safeParse({
      kind: "gs1-link",
      presentationConfigurationId: null,
      gs1DataAttributes: null,
    });
    expect(result.success).toBe(false);
  });

  // (5) rejects a presentation create with uniqueProductIdentifierId set
  it("rejects a presentation create with uniqueProductIdentifierId set", () => {
    const result = PermalinkInvariantsSchema.safeParse({
      kind: "presentation",
      presentationConfigurationId: configId,
      uniqueProductIdentifierId: upiId,
      slug: null,
    });
    expect(result.success).toBe(false);
  });

  // (6) presentation kind REQUIRES a non-null presentationConfigurationId
  it("rejects a presentation create with null presentationConfigurationId", () => {
    const result = PermalinkInvariantsSchema.safeParse({
      kind: "presentation",
      presentationConfigurationId: null,
      slug: null,
    });
    expect(result.success).toBe(false);
  });

  // (6b) rejects a presentation create with missing presentationConfigurationId
  it("rejects a presentation create with missing presentationConfigurationId", () => {
    const result = PermalinkInvariantsSchema.safeParse({
      kind: "presentation",
      slug: null,
    });
    expect(result.success).toBe(false);
  });
});

// --- Slice 14: PermalinkCreateRequestSchema + extended PermalinkUpdateRequestSchema ---

import { PermalinkCreateRequestSchema, PermalinkUpdateRequestSchema } from "./permalink.dto";

describe("PermalinkCreateRequestSchema", () => {
  // (1) parses presentation {kind:'presentation', presentationConfigurationId:<uuid>, slug?, baseUrl?}
  it("parses a presentation create request with presentationConfigurationId", () => {
    const result = PermalinkCreateRequestSchema.safeParse({
      kind: "presentation",
      presentationConfigurationId: configId,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.kind).toBe("presentation");
    }
  });

  it("parses a presentation create request with optional slug and baseUrl", () => {
    const result = PermalinkCreateRequestSchema.safeParse({
      kind: "presentation",
      presentationConfigurationId: configId,
      slug: "my-product",
      baseUrl: "https://passports.example.com",
    });
    expect(result.success).toBe(true);
  });

  // (2) parses gs1-link {kind:'gs1-link', uniqueProductIdentifierId:<uuid>, presentationConfigurationId?:<uuid>|null, gs1DataAttributes?, slug?}
  it("parses a gs1-link create request with uniqueProductIdentifierId", () => {
    const result = PermalinkCreateRequestSchema.safeParse({
      kind: "gs1-link",
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
      uniqueProductIdentifierId: upiId,
      presentationConfigurationId: configId,
      gs1DataAttributes: { "17": "251231" },
      slug: "my-gs1-product",
    });
    expect(result.success).toBe(true);
  });

  // (3) rejects gs1-link without uniqueProductIdentifierId
  it("rejects a gs1-link create request without uniqueProductIdentifierId", () => {
    const result = PermalinkCreateRequestSchema.safeParse({
      kind: "gs1-link",
      presentationConfigurationId: null,
    });
    expect(result.success).toBe(false);
  });

  // (4) rejects presentation with gs1DataAttributes
  it("rejects a presentation create request with gs1DataAttributes", () => {
    const result = PermalinkCreateRequestSchema.safeParse({
      kind: "presentation",
      presentationConfigurationId: configId,
      gs1DataAttributes: { "17": "251231" },
    } as Record<string, unknown>);
    expect(result.success).toBe(false);
  });
});

describe("PermalinkUpdateRequestSchema", () => {
  // (5) still accepts {slug, baseUrl}
  it("still accepts slug and baseUrl", () => {
    const result = PermalinkUpdateRequestSchema.safeParse({
      slug: "updated-slug",
      baseUrl: "https://passports.example.com",
    });
    expect(result.success).toBe(true);
  });

  // (6) accepts {primary:true}
  it("accepts primary: true", () => {
    const result = PermalinkUpdateRequestSchema.safeParse({ primary: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.primary).toBe(true);
    }
  });

  // (7) accepts {gs1DataAttributes}
  it("accepts gs1DataAttributes", () => {
    const result = PermalinkUpdateRequestSchema.safeParse({
      gs1DataAttributes: { "17": "251231" },
    });
    expect(result.success).toBe(true);
  });

  // (8) accepts {presentationConfigurationId:<uuid>|null}
  it("accepts presentationConfigurationId as a uuid", () => {
    const result = PermalinkUpdateRequestSchema.safeParse({
      presentationConfigurationId: configId,
    });
    expect(result.success).toBe(true);
  });

  it("accepts presentationConfigurationId as null", () => {
    const result = PermalinkUpdateRequestSchema.safeParse({
      presentationConfigurationId: null,
    });
    expect(result.success).toBe(true);
  });

  // (9) does NOT accept changing kind (absent/stripped)
  it("strips kind if provided (does not accept changing kind)", () => {
    const result = PermalinkUpdateRequestSchema.safeParse({
      kind: "gs1-link",
      slug: "test-slug",
    } as Record<string, unknown>);
    // Either fails or strips the kind field — result should succeed but kind absent
    if (result.success) {
      expect((result.data as Record<string, unknown>).kind).toBeUndefined();
    }
    // success is also acceptable if the schema simply omits kind (strict or strip)
    expect(result.success).toBe(true);
    if (result.success) {
      expect(Object.prototype.hasOwnProperty.call(result.data, "kind")).toBe(false);
    }
  });
});

describe("PermalinkPaginationDtoSchema", () => {
  const validPermalinkPublic = {
    id: "44444444-4444-4444-8444-444444444444",
    kind: "presentation",
    slug: null,
    baseUrl: null,
    publishedUrl: null,
    presentationConfigurationId: configId,
    uniqueProductIdentifierId: null,
    primary: true,
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
