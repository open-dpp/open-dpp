import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { describe, expect, it, jest } from "@jest/globals";
import { NotFoundException } from "@nestjs/common";
import { PermalinkKind } from "@open-dpp/dto";
import { UniqueProductIdentifier } from "../../domain/unique.product.identifier";
import { Gs1IdentityService } from "./gs1-identity.service";

const VALID_GTIN13 = "4006381333931";
const VALID_GTIN13_AS_14 = "04006381333931";
const RESOLVER_BASE = "https://id.example.com/p";
const RESOLVER_ORIGIN = "https://id.example.com";

function makeService(overrides?: {
  upiRepo?: Partial<{
    findByReferenceIdAndType: jest.Mock;
    findByGs1Key: jest.Mock;
  }>;
  permalinkService?: Partial<{
    resolveToPassport: jest.Mock;
    resolvePublicUrlWithFreeze: jest.Mock;
    getPermalinkBaseUrl: jest.Mock;
    loadBranding: jest.Mock;
  }>;
  permalinkRepo?: Partial<{
    findGs1LinkByUpiId: jest.Mock;
  }>;
  baseUrlResolver?: Partial<{
    getResolverBase: jest.Mock;
    loadBrandingOrNull: jest.Mock;
  }>;
}) {
  const upiRepo = {
    findByReferenceIdAndType: jest.fn(),
    findByGs1Key: jest.fn(),
    ...overrides?.upiRepo,
  };
  const permalinkService = {
    resolveToPassport: jest.fn(),
    resolvePublicUrlWithFreeze: jest.fn(),
    getPermalinkBaseUrl: jest.fn(),
    loadBranding: jest.fn(async () => ({ permalinkBaseUrl: null })),
    ...overrides?.permalinkService,
  };
  const permalinkRepo = {
    findGs1LinkByUpiId: jest.fn(async () => undefined),
    ...overrides?.permalinkRepo,
  };
  const baseUrlResolver = {
    getResolverBase: jest.fn(async () => RESOLVER_BASE),
    loadBrandingOrNull: jest.fn(async () => null),
    ...overrides?.baseUrlResolver,
  };
  const service = new Gs1IdentityService(
    upiRepo as never,
    permalinkService as never,
    permalinkRepo as never,
    baseUrlResolver as never,
  );
  return { service, upiRepo, permalinkService, permalinkRepo, baseUrlResolver };
}

describe("Slice 38 — Gs1IdentityService source must not contain write paths", () => {
  const serviceSrc = readFileSync(
    resolve(
      process.cwd(),
      "src/unique-product-identifier/application/services/gs1-identity.service.ts",
    ),
    "utf-8",
  );

  it("does not reference deleteByReferenceIdAndType (removed with removeIdentity)", () => {
    expect(serviceSrc).not.toContain("deleteByReferenceIdAndType");
  });

  it("does not contain a setIdentity method", () => {
    expect(serviceSrc).not.toMatch(/\bsetIdentity\b/);
  });

  it("does not contain a removeIdentity method", () => {
    expect(serviceSrc).not.toMatch(/\bremoveIdentity\b/);
  });

  it("does not perform a GS1 write via findByReferenceIdAndType(GS1) — only getIdentity (read) is allowed", () => {
    expect(serviceSrc).not.toMatch(/\brepo\.save\b|\buniqueProductIdentifierRepository\.save\b/);
  });

  it("delegates getResolverBase to BaseUrlResolver (no duplicate cascade)", () => {
    expect(serviceSrc).toContain("baseUrlResolver.getResolverBase");
    expect(serviceSrc).not.toContain("loadOrgResolverOverride");
    expect(serviceSrc).not.toContain("loadInstanceResolverSetting");
  });
});

describe("Gs1IdentityService.getIdentity", () => {
  it("returns the GS1 identity with the assembled Digital Link", async () => {
    const referenceId = randomUUID();
    const upi = UniqueProductIdentifier.createGs1({
      referenceId,
      gtin: VALID_GTIN13,
      batch: "LOT-42",
      serial: "SN-001",
    });
    const { service } = makeService({
      upiRepo: { findByReferenceIdAndType: jest.fn(async () => upi) },
    });
    const result = await service.getIdentity(referenceId);
    expect(result).toEqual({
      uuid: upi.uuid,
      referenceId,
      gtin: VALID_GTIN13_AS_14,
      batch: "LOT-42",
      serial: "SN-001",
      digitalLink: `${RESOLVER_ORIGIN}/gs1/v1/01/${VALID_GTIN13_AS_14}/10/LOT-42/21/SN-001`,
    });
  });

  it("returns null when the passport has no GS1 identity", async () => {
    const { service } = makeService({
      upiRepo: { findByReferenceIdAndType: jest.fn(async () => undefined) },
    });
    expect(await service.getIdentity(randomUUID())).toBeNull();
  });

  it("builds the Digital Link against the configured instance resolver base (delegates to BaseUrlResolver)", async () => {
    const referenceId = randomUUID();
    const organizationId = randomUUID();
    const upi = UniqueProductIdentifier.createGs1({ referenceId, gtin: VALID_GTIN13 });
    const { service, baseUrlResolver } = makeService({
      upiRepo: { findByReferenceIdAndType: jest.fn(async () => upi) },
      baseUrlResolver: {
        getResolverBase: jest.fn(async () => "https://id.instance.example.com/p"),
      },
    });

    const result = await service.getIdentity(referenceId, organizationId);

    expect(result?.digitalLink).toBe(
      `https://id.instance.example.com/gs1/v1/01/${VALID_GTIN13_AS_14}`,
    );
    expect(baseUrlResolver.getResolverBase).toHaveBeenCalledWith(organizationId);
  });
});

describe("Gs1IdentityService.resolveGs1KeyToPublicUrl", () => {
  it("404s when no GS1 UPI carries the key", async () => {
    const { service } = makeService({
      upiRepo: { findByGs1Key: jest.fn(async () => undefined) },
    });
    await expect(service.resolveGs1KeyToPublicUrl({ gtin: VALID_GTIN13 })).rejects.toThrow(
      NotFoundException,
    );
  });

  it("looks up the EXACT full key (gtin + batch + serial)", async () => {
    const referenceId = randomUUID();
    const upi = UniqueProductIdentifier.createGs1({
      referenceId,
      gtin: VALID_GTIN13,
      batch: "LOT-42",
      serial: "SN-001",
    });
    const gs1LinkPermalink = { id: randomUUID(), slug: null };
    const passport = { organizationId: randomUUID() };
    const { service, upiRepo } = makeService({
      upiRepo: { findByGs1Key: jest.fn(async () => upi) },
      permalinkRepo: { findGs1LinkByUpiId: jest.fn(async () => gs1LinkPermalink) },
      permalinkService: {
        resolveToPassport: jest.fn(async () => ({ permalink: gs1LinkPermalink, passport })),
        getPermalinkBaseUrl: jest.fn(async () => "https://instance.example.com/p"),
        resolvePublicUrlWithFreeze: jest.fn(async () => ({
          permalink: gs1LinkPermalink,
          publicUrl: `https://instance.example.com/gs1/v1/01/${VALID_GTIN13_AS_14}`,
        })),
      },
    });

    await service.resolveGs1KeyToPublicUrl({
      gtin: VALID_GTIN13,
      batch: "LOT-42",
      serial: "SN-001",
    });

    expect(upiRepo.findByGs1Key).toHaveBeenCalledWith({
      gtin: VALID_GTIN13,
      batch: "LOT-42",
      serial: "SN-001",
    });
  });

  it("resolves to the gs1-link's own viewer URL (publish-gated by resolveToPassport)", async () => {
    const referenceId = randomUUID();
    const upi = UniqueProductIdentifier.createGs1({ referenceId, gtin: VALID_GTIN13 });
    const gs1LinkPermalink = { id: randomUUID(), slug: "my-slug" };
    const passport = { organizationId: randomUUID() };
    const { service, permalinkService } = makeService({
      upiRepo: { findByGs1Key: jest.fn(async () => upi) },
      permalinkRepo: { findGs1LinkByUpiId: jest.fn(async () => gs1LinkPermalink) },
      permalinkService: {
        resolveToPassport: jest.fn(async () => ({ permalink: gs1LinkPermalink, passport })),
        getPermalinkBaseUrl: jest.fn(async () => "https://instance.example.com/p"),
        resolvePublicUrlWithFreeze: jest.fn(async () => ({
          permalink: gs1LinkPermalink,
          publicUrl: `https://instance.example.com/gs1/v1/01/${VALID_GTIN13_AS_14}`,
        })),
      },
    });

    const url = await service.resolveGs1KeyToPublicUrl({ gtin: VALID_GTIN13 });

    expect(url).toBe("https://instance.example.com/p/my-slug");
    expect(permalinkService.resolveToPassport).toHaveBeenCalledWith(gs1LinkPermalink.id, undefined);
  });

  it("propagates the NotFound gate when the passport is unpublished (anonymous)", async () => {
    const referenceId = randomUUID();
    const upi = UniqueProductIdentifier.createGs1({ referenceId, gtin: VALID_GTIN13 });
    const gs1LinkPermalink = { id: randomUUID(), slug: null };
    const { service } = makeService({
      upiRepo: { findByGs1Key: jest.fn(async () => upi) },
      permalinkRepo: { findGs1LinkByUpiId: jest.fn(async () => gs1LinkPermalink) },
      permalinkService: {
        resolveToPassport: jest.fn(async () => {
          throw new NotFoundException("gated");
        }),
      },
    });
    await expect(service.resolveGs1KeyToPublicUrl({ gtin: VALID_GTIN13 })).rejects.toThrow(
      NotFoundException,
    );
  });

  it("(Slice 31-b) uses the UPI's gs1-link permalink when it has a presentationConfigurationId", async () => {
    const referenceId = randomUUID();
    const upi = UniqueProductIdentifier.createGs1({ referenceId, gtin: VALID_GTIN13 });
    const gs1LinkPermalinkId = randomUUID();
    const gs1LinkPermalink = {
      id: gs1LinkPermalinkId,
      kind: PermalinkKind.GS1_LINK,
      slug: null,
      presentationConfigurationId: randomUUID(),
    };
    const passport = { organizationId: randomUUID() };
    const { service, permalinkRepo, permalinkService } = makeService({
      upiRepo: { findByGs1Key: jest.fn(async () => upi) },
      permalinkRepo: {
        findGs1LinkByUpiId: jest.fn(async () => gs1LinkPermalink),
      },
      permalinkService: {
        resolveToPassport: jest.fn(async () => ({ permalink: gs1LinkPermalink, passport })),
        getPermalinkBaseUrl: jest.fn(async () => "https://instance.example.com/p"),
        resolvePublicUrlWithFreeze: jest.fn(async () => ({
          permalink: gs1LinkPermalink,
          publicUrl: `https://instance.example.com/gs1/v1/01/${VALID_GTIN13_AS_14}`,
        })),
      },
    });

    const url = await service.resolveGs1KeyToPublicUrl({ gtin: VALID_GTIN13 });

    expect(permalinkRepo.findGs1LinkByUpiId).toHaveBeenCalledWith(upi.uuid);
    expect(permalinkService.resolveToPassport).toHaveBeenCalledWith(gs1LinkPermalinkId, undefined);
    expect(url).toBe(`https://instance.example.com/p/${gs1LinkPermalinkId}`);
    expect(url).not.toContain("/01/");
    expect(permalinkService.resolvePublicUrlWithFreeze).toHaveBeenCalledTimes(1);
  });

  it("(M1) uses the gs1-link permalink's slug in the viewer URL when set", async () => {
    const referenceId = randomUUID();
    const upi = UniqueProductIdentifier.createGs1({ referenceId, gtin: VALID_GTIN13 });
    const gs1LinkPermalink = {
      id: randomUUID(),
      kind: PermalinkKind.GS1_LINK,
      slug: "scan-me",
      presentationConfigurationId: randomUUID(),
    };
    const passport = { organizationId: randomUUID() };
    const { service } = makeService({
      upiRepo: { findByGs1Key: jest.fn(async () => upi) },
      permalinkRepo: { findGs1LinkByUpiId: jest.fn(async () => gs1LinkPermalink) },
      permalinkService: {
        resolveToPassport: jest.fn(async () => ({ permalink: gs1LinkPermalink, passport })),
        getPermalinkBaseUrl: jest.fn(async () => "https://instance.example.com/p"),
        resolvePublicUrlWithFreeze: jest.fn(async () => ({
          permalink: gs1LinkPermalink,
          publicUrl: `https://instance.example.com/gs1/v1/01/${VALID_GTIN13_AS_14}`,
        })),
      },
    });

    const url = await service.resolveGs1KeyToPublicUrl({ gtin: VALID_GTIN13 });

    expect(url).toBe("https://instance.example.com/p/scan-me");
  });

  it("(M1) viewer URL uses the branding base and ignores the gs1-link's own baseUrl", async () => {
    const referenceId = randomUUID();
    const upi = UniqueProductIdentifier.createGs1({ referenceId, gtin: VALID_GTIN13 });
    const gs1LinkPermalink = {
      id: randomUUID(),
      kind: PermalinkKind.GS1_LINK,
      slug: null,
      baseUrl: "https://qr.example.com",
      presentationConfigurationId: randomUUID(),
    };
    const passport = { organizationId: randomUUID() };
    const { service } = makeService({
      upiRepo: { findByGs1Key: jest.fn(async () => upi) },
      permalinkRepo: { findGs1LinkByUpiId: jest.fn(async () => gs1LinkPermalink) },
      permalinkService: {
        resolveToPassport: jest.fn(async () => ({ permalink: gs1LinkPermalink, passport })),
        getPermalinkBaseUrl: jest.fn(async () => "https://instance.example.com/p"),
        resolvePublicUrlWithFreeze: jest.fn(async () => ({
          permalink: gs1LinkPermalink,
          publicUrl: `https://qr.example.com/gs1/v1/01/${VALID_GTIN13_AS_14}`,
        })),
      },
      baseUrlResolver: {
        loadBrandingOrNull: jest.fn(async () => ({
          permalinkBaseUrl: "https://brand.example.com",
        })),
      },
    });

    const url = await service.resolveGs1KeyToPublicUrl({ gtin: VALID_GTIN13 });

    expect(url).toBe(`https://brand.example.com/${gs1LinkPermalink.id}`);
  });

  it("resolves a null-config gs1-link to its OWN viewer URL (standard view, no fallback)", async () => {
    const referenceId = randomUUID();
    const upi = UniqueProductIdentifier.createGs1({ referenceId, gtin: VALID_GTIN13 });
    const gs1LinkPermalink = { id: randomUUID(), slug: null, presentationConfigurationId: null };
    const passport = { organizationId: randomUUID() };
    const { service, permalinkRepo, permalinkService } = makeService({
      upiRepo: { findByGs1Key: jest.fn(async () => upi) },
      permalinkRepo: {
        findGs1LinkByUpiId: jest.fn(async () => gs1LinkPermalink),
      },
      permalinkService: {
        resolveToPassport: jest.fn(async () => ({ permalink: gs1LinkPermalink, passport })),
        getPermalinkBaseUrl: jest.fn(async () => "https://instance.example.com/p"),
        resolvePublicUrlWithFreeze: jest.fn(async () => ({
          permalink: gs1LinkPermalink,
          publicUrl: `https://instance.example.com/gs1/v1/01/${VALID_GTIN13_AS_14}`,
        })),
      },
    });

    const url = await service.resolveGs1KeyToPublicUrl({ gtin: VALID_GTIN13 });

    expect(permalinkRepo.findGs1LinkByUpiId).toHaveBeenCalledWith(upi.uuid);
    expect(permalinkService.resolveToPassport).toHaveBeenCalledWith(gs1LinkPermalink.id, undefined);
    expect(url).toBe(`https://instance.example.com/p/${gs1LinkPermalink.id}`);
  });

  it("404s when the UPI has no gs1-link permalink (no fallback to other permalinks)", async () => {
    const referenceId = randomUUID();
    const upi = UniqueProductIdentifier.createGs1({ referenceId, gtin: VALID_GTIN13 });
    const { service } = makeService({
      upiRepo: { findByGs1Key: jest.fn(async () => upi) },
      permalinkRepo: {
        findGs1LinkByUpiId: jest.fn(async () => undefined),
      },
    });

    await expect(service.resolveGs1KeyToPublicUrl({ gtin: VALID_GTIN13 })).rejects.toThrow(
      NotFoundException,
    );
  });

  it("(Slice 31-g) cross-passport own-config: config's passport published, UPI's passport draft → anonymous scan resolves", async () => {
    const upiPassportId = randomUUID();
    const configPassportId = randomUUID();
    const upi = UniqueProductIdentifier.createGs1({
      referenceId: upiPassportId,
      gtin: VALID_GTIN13,
    });
    const gs1LinkPermalinkId = randomUUID();
    const gs1LinkPermalink = {
      id: gs1LinkPermalinkId,
      kind: PermalinkKind.GS1_LINK,
      slug: null,
      presentationConfigurationId: randomUUID(),
    };
    const configPassport = { organizationId: randomUUID() };
    const { service, permalinkService } = makeService({
      upiRepo: { findByGs1Key: jest.fn(async () => upi) },
      permalinkRepo: {
        findGs1LinkByUpiId: jest.fn(async () => gs1LinkPermalink),
      },
      permalinkService: {
        resolveToPassport: jest.fn(async () => ({
          permalink: gs1LinkPermalink,
          passport: configPassport,
        })),
        getPermalinkBaseUrl: jest.fn(async () => "https://instance.example.com/p"),
        resolvePublicUrlWithFreeze: jest.fn(async () => ({
          permalink: gs1LinkPermalink,
          publicUrl: `https://instance.example.com/gs1/v1/01/${VALID_GTIN13_AS_14}`,
        })),
      },
    });

    const url = await service.resolveGs1KeyToPublicUrl({ gtin: VALID_GTIN13 });

    expect(permalinkService.resolveToPassport).toHaveBeenCalledWith(gs1LinkPermalinkId, undefined);
    expect(url).toBe(`https://instance.example.com/p/${gs1LinkPermalinkId}`);
    expect(url).not.toContain("/01/");
    void configPassportId;
  });

  it("(Slice 31-g) cross-passport own-config: config's passport draft → anonymous scan is gated (404)", async () => {
    const upiPassportId = randomUUID();
    const upi = UniqueProductIdentifier.createGs1({
      referenceId: upiPassportId,
      gtin: VALID_GTIN13,
    });
    const gs1LinkPermalink = {
      id: randomUUID(),
      presentationConfigurationId: randomUUID(),
    };
    const { service } = makeService({
      upiRepo: { findByGs1Key: jest.fn(async () => upi) },
      permalinkRepo: {
        findGs1LinkByUpiId: jest.fn(async () => gs1LinkPermalink),
      },
      permalinkService: {
        resolveToPassport: jest.fn(async () => {
          throw new NotFoundException("gated: config passport is draft");
        }),
      },
    });

    await expect(service.resolveGs1KeyToPublicUrl({ gtin: VALID_GTIN13 })).rejects.toThrow(
      NotFoundException,
    );
  });
});
