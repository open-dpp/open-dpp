import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { describe, expect, it, jest } from "@jest/globals";
import { NotFoundException } from "@nestjs/common";
import { UniqueProductIdentifier } from "../../domain/unique.product.identifier";
import { Gs1IdentityService } from "./gs1-identity.service";

const VALID_GTIN13 = "4006381333931";
const VALID_GTIN13_AS_14 = "04006381333931";
const RESOLVER_BASE = "https://id.example.com";

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
    findAllByPassportId: jest.Mock;
    findPrimaryByPassportId: jest.Mock;
    findGs1LinkByUpiId: jest.Mock;
  }>;
  gs1ResolverBaseService?: Partial<{
    getResolverBase: jest.Mock;
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
    findAllByPassportId: jest.fn(),
    findPrimaryByPassportId: jest.fn(),
    findGs1LinkByUpiId: jest.fn(async () => undefined),
    ...overrides?.permalinkRepo,
  };
  const gs1ResolverBaseService = {
    getResolverBase: jest.fn(async () => RESOLVER_BASE),
    ...overrides?.gs1ResolverBaseService,
  };
  const service = new Gs1IdentityService(
    upiRepo as never,
    permalinkService as never,
    permalinkRepo as never,
    gs1ResolverBaseService as never,
  );
  return { service, upiRepo, permalinkService, permalinkRepo, gs1ResolverBaseService };
}

// ---------------------------------------------------------------------------
// Slice 38 — structural assertions: the service must NOT contain write paths
// ---------------------------------------------------------------------------

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
    // The method name must not appear as a method definition
    expect(serviceSrc).not.toMatch(/\bsetIdentity\b/);
  });

  it("does not contain a removeIdentity method", () => {
    expect(serviceSrc).not.toMatch(/\bremoveIdentity\b/);
  });

  it("does not perform a GS1 write via findByReferenceIdAndType(GS1) — only getIdentity (read) is allowed", () => {
    // The service is allowed to call findByReferenceIdAndType for getIdentity (read),
    // but there must be exactly one call site (the getIdentity method) and it must not
    // be wrapped inside a write (save) path. We check that `save` is no longer called
    // alongside findByReferenceIdAndType.
    //
    // Structural check: no call to repo.save() remains in the service at all
    // (writes moved to UpiCollectionService).
    expect(serviceSrc).not.toMatch(/\brepo\.save\b|\buniqueProductIdentifierRepository\.save\b/);
  });

  it("delegates getResolverBase to Gs1ResolverBaseService (no duplicate implementation)", () => {
    // The service must inject Gs1ResolverBaseService; it must NOT define its own
    // getResolverBase cascade (that lives in Gs1ResolverBaseService now).
    expect(serviceSrc).not.toContain("loadOrgResolverOverride");
    expect(serviceSrc).not.toContain("loadInstanceResolverSetting");
  });
});

// ---------------------------------------------------------------------------
// getIdentity — still present and working
// ---------------------------------------------------------------------------

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
      digitalLink: `${RESOLVER_BASE}/01/${VALID_GTIN13_AS_14}/10/LOT-42/21/SN-001`,
    });
  });

  it("returns null when the passport has no GS1 identity", async () => {
    const { service } = makeService({
      upiRepo: { findByReferenceIdAndType: jest.fn(async () => undefined) },
    });
    expect(await service.getIdentity(randomUUID())).toBeNull();
  });

  it("builds the Digital Link against the configured instance resolver base (delegates to Gs1ResolverBaseService)", async () => {
    const referenceId = randomUUID();
    const organizationId = randomUUID();
    const upi = UniqueProductIdentifier.createGs1({ referenceId, gtin: VALID_GTIN13 });
    const { service, gs1ResolverBaseService } = makeService({
      upiRepo: { findByReferenceIdAndType: jest.fn(async () => upi) },
      gs1ResolverBaseService: {
        getResolverBase: jest.fn(async () => "https://id.instance.example.com"),
      },
    });

    const result = await service.getIdentity(referenceId, organizationId);

    expect(result?.digitalLink).toBe(`https://id.instance.example.com/01/${VALID_GTIN13_AS_14}`);
    expect(gs1ResolverBaseService.getResolverBase).toHaveBeenCalledWith(organizationId);
  });
});

// ---------------------------------------------------------------------------
// resolveGs1KeyToPublicUrl — still present and working
// ---------------------------------------------------------------------------

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
    const permalink = { id: randomUUID() };
    const passport = { organizationId: randomUUID() };
    const { service, upiRepo } = makeService({
      upiRepo: { findByGs1Key: jest.fn(async () => upi) },
      permalinkRepo: { findPrimaryByPassportId: jest.fn(async () => permalink) },
      permalinkService: {
        resolveToPassport: jest.fn(async () => ({ permalink, passport })),
        getPermalinkBaseUrl: jest.fn(async () => "https://instance.example.com/p"),
        loadBranding: jest.fn(async () => ({ permalinkBaseUrl: null })),
        resolvePublicUrlWithFreeze: jest.fn(async () => ({
          permalink,
          publicUrl: "https://instance.example.com/p/my-slug",
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

  it("404s when the passport has no primary permalink (findPrimaryByPassportId → undefined)", async () => {
    const referenceId = randomUUID();
    const upi = UniqueProductIdentifier.createGs1({ referenceId, gtin: VALID_GTIN13 });
    const { service } = makeService({
      upiRepo: { findByGs1Key: jest.fn(async () => upi) },
      permalinkRepo: { findPrimaryByPassportId: jest.fn(async () => undefined) },
    });
    await expect(service.resolveGs1KeyToPublicUrl({ gtin: VALID_GTIN13 })).rejects.toThrow(
      NotFoundException,
    );
  });

  it("resolves via the PRIMARY permalink when the passport has two and the non-first is primary", async () => {
    const referenceId = randomUUID();
    const upi = UniqueProductIdentifier.createGs1({ referenceId, gtin: VALID_GTIN13 });
    const nonPrimaryPermalink = { id: randomUUID() };
    const primaryPermalink = { id: randomUUID() };
    const passport = { organizationId: randomUUID() };
    const branding = { permalinkBaseUrl: null };
    // findPrimaryByPassportId returns the second permalink (primary), not the first
    const { service, permalinkService, permalinkRepo } = makeService({
      upiRepo: { findByGs1Key: jest.fn(async () => upi) },
      permalinkRepo: { findPrimaryByPassportId: jest.fn(async () => primaryPermalink) },
      permalinkService: {
        resolveToPassport: jest.fn(async () => ({ permalink: primaryPermalink, passport })),
        getPermalinkBaseUrl: jest.fn(async () => "https://instance.example.com/p"),
        loadBranding: jest.fn(async () => branding),
        resolvePublicUrlWithFreeze: jest.fn(async () => ({
          permalink: primaryPermalink,
          publicUrl: `https://instance.example.com/p/${primaryPermalink.id}`,
        })),
      },
    });

    const url = await service.resolveGs1KeyToPublicUrl({ gtin: VALID_GTIN13 });

    // Resolution went through the PRIMARY (second) permalink, not the first
    expect(permalinkRepo.findPrimaryByPassportId).toHaveBeenCalledWith(referenceId);
    expect(permalinkService.resolveToPassport).toHaveBeenCalledWith(primaryPermalink.id, undefined);
    expect(url).toContain(primaryPermalink.id);
    // The non-primary permalink's id is NOT in the URL
    expect(url).not.toContain(nonPrimaryPermalink.id);
  });

  it("resolves to the permalink public URL (publish-gated by resolveToPassport)", async () => {
    const referenceId = randomUUID();
    const upi = UniqueProductIdentifier.createGs1({ referenceId, gtin: VALID_GTIN13 });
    const permalink = { id: randomUUID() };
    const passport = { organizationId: randomUUID() };
    const branding = { permalinkBaseUrl: null };
    const { service, permalinkService } = makeService({
      upiRepo: { findByGs1Key: jest.fn(async () => upi) },
      permalinkRepo: { findPrimaryByPassportId: jest.fn(async () => permalink) },
      permalinkService: {
        resolveToPassport: jest.fn(async () => ({ permalink, passport })),
        getPermalinkBaseUrl: jest.fn(async () => "https://instance.example.com/p"),
        loadBranding: jest.fn(async () => branding),
        resolvePublicUrlWithFreeze: jest.fn(async () => ({
          permalink,
          publicUrl: "https://instance.example.com/p/my-slug",
        })),
      },
    });

    const url = await service.resolveGs1KeyToPublicUrl({ gtin: VALID_GTIN13 });

    expect(url).toBe("https://instance.example.com/p/my-slug");
    expect(permalinkService.resolveToPassport).toHaveBeenCalledWith(permalink.id, undefined);
  });

  it("propagates the NotFound gate when the passport is unpublished (anonymous)", async () => {
    const referenceId = randomUUID();
    const upi = UniqueProductIdentifier.createGs1({ referenceId, gtin: VALID_GTIN13 });
    const permalink = { id: randomUUID() };
    const { service } = makeService({
      upiRepo: { findByGs1Key: jest.fn(async () => upi) },
      permalinkRepo: { findPrimaryByPassportId: jest.fn(async () => permalink) },
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
    const gs1LinkPermalink = { id: gs1LinkPermalinkId, presentationConfigurationId: randomUUID() };
    const passport = { organizationId: randomUUID() };
    const branding = { permalinkBaseUrl: null };
    const { service, permalinkRepo, permalinkService } = makeService({
      upiRepo: { findByGs1Key: jest.fn(async () => upi) },
      permalinkRepo: {
        findGs1LinkByUpiId: jest.fn(async () => gs1LinkPermalink),
        findPrimaryByPassportId: jest.fn(async () => ({ id: randomUUID() })),
      },
      permalinkService: {
        resolveToPassport: jest.fn(async () => ({ permalink: gs1LinkPermalink, passport })),
        getPermalinkBaseUrl: jest.fn(async () => "https://instance.example.com/p"),
        loadBranding: jest.fn(async () => branding),
        resolvePublicUrlWithFreeze: jest.fn(async () => ({
          permalink: gs1LinkPermalink,
          publicUrl: `https://instance.example.com/p/${gs1LinkPermalinkId}`,
        })),
      },
    });

    const url = await service.resolveGs1KeyToPublicUrl({ gtin: VALID_GTIN13 });

    // findGs1LinkByUpiId was called with the UPI's uuid
    expect(permalinkRepo.findGs1LinkByUpiId).toHaveBeenCalledWith(upi.uuid);
    // resolveToPassport used the gs1-link permalink (not the passport primary)
    expect(permalinkService.resolveToPassport).toHaveBeenCalledWith(gs1LinkPermalinkId, undefined);
    expect(url).toContain(gs1LinkPermalinkId);
    // passport primary was NOT consulted
    expect(permalinkRepo.findPrimaryByPassportId).not.toHaveBeenCalled();
  });

  it("(Slice 31-c) falls back to passport primary when gs1-link permalink has null presentationConfigurationId", async () => {
    const referenceId = randomUUID();
    const upi = UniqueProductIdentifier.createGs1({ referenceId, gtin: VALID_GTIN13 });
    const gs1LinkPermalink = { id: randomUUID(), presentationConfigurationId: null };
    const primaryPermalinkId = randomUUID();
    const primaryPermalink = { id: primaryPermalinkId };
    const passport = { organizationId: randomUUID() };
    const branding = { permalinkBaseUrl: null };
    const { service, permalinkRepo, permalinkService } = makeService({
      upiRepo: { findByGs1Key: jest.fn(async () => upi) },
      permalinkRepo: {
        findGs1LinkByUpiId: jest.fn(async () => gs1LinkPermalink),
        findPrimaryByPassportId: jest.fn(async () => primaryPermalink),
      },
      permalinkService: {
        resolveToPassport: jest.fn(async () => ({ permalink: primaryPermalink, passport })),
        getPermalinkBaseUrl: jest.fn(async () => "https://instance.example.com/p"),
        loadBranding: jest.fn(async () => branding),
        resolvePublicUrlWithFreeze: jest.fn(async () => ({
          permalink: primaryPermalink,
          publicUrl: `https://instance.example.com/p/${primaryPermalinkId}`,
        })),
      },
    });

    const url = await service.resolveGs1KeyToPublicUrl({ gtin: VALID_GTIN13 });

    // Fell back to passport primary because gs1-link had null config
    expect(permalinkRepo.findGs1LinkByUpiId).toHaveBeenCalledWith(upi.uuid);
    expect(permalinkRepo.findPrimaryByPassportId).toHaveBeenCalledWith(referenceId);
    expect(permalinkService.resolveToPassport).toHaveBeenCalledWith(primaryPermalinkId, undefined);
    expect(url).toContain(primaryPermalinkId);
  });

  it("(Slice 31-d) falls back to passport primary when no gs1-link permalink exists", async () => {
    const referenceId = randomUUID();
    const upi = UniqueProductIdentifier.createGs1({ referenceId, gtin: VALID_GTIN13 });
    const primaryPermalinkId = randomUUID();
    const primaryPermalink = { id: primaryPermalinkId };
    const passport = { organizationId: randomUUID() };
    const branding = { permalinkBaseUrl: null };
    const { service, permalinkRepo, permalinkService } = makeService({
      upiRepo: { findByGs1Key: jest.fn(async () => upi) },
      permalinkRepo: {
        findGs1LinkByUpiId: jest.fn(async () => undefined),
        findPrimaryByPassportId: jest.fn(async () => primaryPermalink),
      },
      permalinkService: {
        resolveToPassport: jest.fn(async () => ({ permalink: primaryPermalink, passport })),
        getPermalinkBaseUrl: jest.fn(async () => "https://instance.example.com/p"),
        loadBranding: jest.fn(async () => branding),
        resolvePublicUrlWithFreeze: jest.fn(async () => ({
          permalink: primaryPermalink,
          publicUrl: `https://instance.example.com/p/${primaryPermalinkId}`,
        })),
      },
    });

    const url = await service.resolveGs1KeyToPublicUrl({ gtin: VALID_GTIN13 });

    expect(permalinkRepo.findGs1LinkByUpiId).toHaveBeenCalledWith(upi.uuid);
    expect(permalinkRepo.findPrimaryByPassportId).toHaveBeenCalledWith(referenceId);
    expect(permalinkService.resolveToPassport).toHaveBeenCalledWith(primaryPermalinkId, undefined);
    expect(url).toContain(primaryPermalinkId);
  });

  it("(Slice 31-e) 404s when no gs1-link and no passport primary exist", async () => {
    const referenceId = randomUUID();
    const upi = UniqueProductIdentifier.createGs1({ referenceId, gtin: VALID_GTIN13 });
    const { service } = makeService({
      upiRepo: { findByGs1Key: jest.fn(async () => upi) },
      permalinkRepo: {
        findGs1LinkByUpiId: jest.fn(async () => undefined),
        findPrimaryByPassportId: jest.fn(async () => undefined),
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
    // gs1-link references a config from a DIFFERENT passport
    const gs1LinkPermalink = {
      id: gs1LinkPermalinkId,
      presentationConfigurationId: randomUUID(), // config that belongs to configPassportId
    };
    // config's passport is PUBLISHED — resolveToPassport succeeds (not gated)
    const configPassport = { organizationId: randomUUID() };
    const branding = { permalinkBaseUrl: null };
    const { service, permalinkService } = makeService({
      upiRepo: { findByGs1Key: jest.fn(async () => upi) },
      permalinkRepo: {
        findGs1LinkByUpiId: jest.fn(async () => gs1LinkPermalink),
        findPrimaryByPassportId: jest.fn(async () => ({ id: randomUUID() })),
      },
      permalinkService: {
        // resolveToPassport resolves the config's passport (published) — does NOT throw
        resolveToPassport: jest.fn(async () => ({
          permalink: gs1LinkPermalink,
          passport: configPassport,
        })),
        getPermalinkBaseUrl: jest.fn(async () => "https://instance.example.com/p"),
        loadBranding: jest.fn(async () => branding),
        resolvePublicUrlWithFreeze: jest.fn(async () => ({
          permalink: gs1LinkPermalink,
          publicUrl: `https://instance.example.com/p/${gs1LinkPermalinkId}`,
        })),
      },
    });

    const url = await service.resolveGs1KeyToPublicUrl({ gtin: VALID_GTIN13 });

    // Used the gs1-link permalink (config's passport governs)
    expect(permalinkService.resolveToPassport).toHaveBeenCalledWith(gs1LinkPermalinkId, undefined);
    expect(url).toContain(gs1LinkPermalinkId);
    void configPassportId; // referenced above for clarity
  });

  it("(Slice 31-g) cross-passport own-config: config's passport draft → anonymous scan is gated (404)", async () => {
    const upiPassportId = randomUUID();
    const upi = UniqueProductIdentifier.createGs1({
      referenceId: upiPassportId,
      gtin: VALID_GTIN13,
    });
    const gs1LinkPermalink = {
      id: randomUUID(),
      presentationConfigurationId: randomUUID(), // config that belongs to a DRAFT passport
    };
    const { service } = makeService({
      upiRepo: { findByGs1Key: jest.fn(async () => upi) },
      permalinkRepo: {
        findGs1LinkByUpiId: jest.fn(async () => gs1LinkPermalink),
        findPrimaryByPassportId: jest.fn(async () => ({ id: randomUUID() })),
      },
      permalinkService: {
        // config's passport is DRAFT → gated for anonymous
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
