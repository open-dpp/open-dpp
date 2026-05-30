import { randomUUID } from "node:crypto";
import { describe, expect, it, jest } from "@jest/globals";
import { NotFoundException } from "@nestjs/common";
import { ValueError } from "@open-dpp/exception";
import { UniqueProductIdentifier } from "../../domain/unique.product.identifier";
import { ExternalIdentifierType } from "../../presentation/dto/unique-product-identifier-dto.schema";
import { Gs1IdentityService } from "./gs1-identity.service";

const VALID_GTIN13 = "4006381333931";
const VALID_GTIN13_AS_14 = "04006381333931";
const RESOLVER_BASE = "https://id.example.com";

function makeService(overrides?: {
  upiRepo?: Partial<{
    findByReferenceIdAndType: jest.Mock;
    findByGs1Key: jest.Mock;
    save: jest.Mock;
    deleteByReferenceIdAndType: jest.Mock;
  }>;
  permalinkService?: Partial<{
    resolveToPassport: jest.Mock;
    resolvePublicUrlWithFreeze: jest.Mock;
    getPermalinkBaseUrl: jest.Mock;
    loadBranding: jest.Mock;
  }>;
  permalinkRepo?: Partial<{ findAllByPassportId: jest.Mock }>;
  instanceSettingsService?: Partial<{ getSettings: jest.Mock }>;
  resolverBase?: string;
  instanceResolverBaseUrl?: string | null;
  brandingResolverBaseUrl?: string | null;
}) {
  const upiRepo = {
    findByReferenceIdAndType: jest.fn(),
    findByGs1Key: jest.fn(),
    save: jest.fn(),
    deleteByReferenceIdAndType: jest.fn(),
    ...overrides?.upiRepo,
  };
  const permalinkService = {
    resolveToPassport: jest.fn(),
    resolvePublicUrlWithFreeze: jest.fn(),
    getPermalinkBaseUrl: jest.fn(),
    loadBranding: jest.fn(async () => ({
      gs1ResolverBaseUrl: overrides?.brandingResolverBaseUrl ?? null,
    })),
    ...overrides?.permalinkService,
  };
  const permalinkRepo = {
    findAllByPassportId: jest.fn(),
    ...overrides?.permalinkRepo,
  };
  const envService = {
    get: jest.fn(() => overrides?.resolverBase ?? RESOLVER_BASE),
  };
  const instanceSettingsService = {
    getSettings: jest.fn(async () => ({
      gs1ResolverBaseUrl: {
        value:
          overrides?.instanceResolverBaseUrl === undefined
            ? null
            : overrides.instanceResolverBaseUrl,
      },
    })),
    ...overrides?.instanceSettingsService,
  };
  const service = new Gs1IdentityService(
    upiRepo as never,
    permalinkService as never,
    permalinkRepo as never,
    envService as never,
    instanceSettingsService as never,
  );
  return { service, upiRepo, permalinkService, permalinkRepo, envService, instanceSettingsService };
}

describe("Gs1IdentityService.getResolverBase — cascade", () => {
  it("falls back to the canonicalised OPEN_DPP_URL bare root when nothing is configured", async () => {
    const { service } = makeService({ resolverBase: "https://id.example.com/" });
    expect(await service.getResolverBase()).toBe("https://id.example.com");
  });

  it("uses the instance setting when set and no org override exists", async () => {
    const { service } = makeService({
      resolverBase: "https://fallback.example.com",
      instanceResolverBaseUrl: "https://id.instance.example.com",
    });
    expect(await service.getResolverBase(randomUUID())).toBe("https://id.instance.example.com");
  });

  it("prefers the per-organization branding override over the instance setting", async () => {
    const { service } = makeService({
      resolverBase: "https://fallback.example.com",
      instanceResolverBaseUrl: "https://id.instance.example.com",
      brandingResolverBaseUrl: "https://id.acme.com",
    });
    expect(await service.getResolverBase(randomUUID())).toBe("https://id.acme.com");
  });

  it("canonicalises the resolved value (host lowercased, trailing slash dropped)", async () => {
    const { service } = makeService({
      brandingResolverBaseUrl: "https://ID.Acme.COM/",
    });
    expect(await service.getResolverBase(randomUUID())).toBe("https://id.acme.com");
  });

  it("ignores a blank branding override and falls through to the instance setting", async () => {
    const { service } = makeService({
      instanceResolverBaseUrl: "https://id.instance.example.com",
      brandingResolverBaseUrl: "   ",
    });
    expect(await service.getResolverBase(randomUUID())).toBe("https://id.instance.example.com");
  });

  it("does not consult branding when no organizationId is provided", async () => {
    const { service, permalinkService } = makeService({
      resolverBase: "https://fallback.example.com",
      instanceResolverBaseUrl: "https://id.instance.example.com",
    });
    const result = await service.getResolverBase();
    expect(result).toBe("https://id.instance.example.com");
    expect(permalinkService.loadBranding).not.toHaveBeenCalled();
  });
});

describe("Gs1IdentityService.setIdentity", () => {
  it("creates a new GS1 UPI when the passport has none, normalizing the GTIN", async () => {
    const referenceId = randomUUID();
    const saved = UniqueProductIdentifier.createGs1({ referenceId, gtin: VALID_GTIN13 });
    const { service, upiRepo } = makeService({
      upiRepo: {
        findByReferenceIdAndType: jest.fn(async () => undefined),
        save: jest.fn(async () => saved),
      },
    });

    const result = await service.setIdentity(referenceId, { gtin: VALID_GTIN13 });

    expect(upiRepo.save).toHaveBeenCalledTimes(1);
    const savedArg = upiRepo.save.mock.calls[0][0] as UniqueProductIdentifier;
    expect(savedArg.type).toBe(ExternalIdentifierType.GS1);
    expect(savedArg.gs1).toEqual({ gtin: VALID_GTIN13_AS_14 });
    expect(savedArg.referenceId).toBe(referenceId);
    expect(result.gtin).toBe(VALID_GTIN13_AS_14);
    expect(result.digitalLink).toBe(`${RESOLVER_BASE}/01/${VALID_GTIN13_AS_14}`);
    expect(result.referenceId).toBe(referenceId);
  });

  it("creates a GS1 UPI carrying batch and serial and returns the full Digital Link", async () => {
    const referenceId = randomUUID();
    const { service, upiRepo } = makeService({
      upiRepo: {
        findByReferenceIdAndType: jest.fn(async () => undefined),
        save: jest.fn(async (u: UniqueProductIdentifier) => u),
      },
    });

    const result = await service.setIdentity(referenceId, {
      gtin: VALID_GTIN13,
      batch: "LOT-42",
      serial: "SN-001",
    });

    const savedArg = upiRepo.save.mock.calls[0][0] as UniqueProductIdentifier;
    expect(savedArg.gs1).toEqual({
      gtin: VALID_GTIN13_AS_14,
      batch: "LOT-42",
      serial: "SN-001",
    });
    expect(result.batch).toBe("LOT-42");
    expect(result.serial).toBe("SN-001");
    expect(result.digitalLink).toBe(
      `${RESOLVER_BASE}/01/${VALID_GTIN13_AS_14}/10/LOT-42/21/SN-001`,
    );
  });

  it("replaces the identity on an existing GS1 UPI (keeps its uuid) and can clear batch/serial", async () => {
    const referenceId = randomUUID();
    const existing = UniqueProductIdentifier.createGs1({
      referenceId,
      gtin: "00012345678905",
      batch: "OLD-LOT",
      serial: "OLD-SN",
    });
    const { service, upiRepo } = makeService({
      upiRepo: {
        findByReferenceIdAndType: jest.fn(async () => existing),
        save: jest.fn(async (u: UniqueProductIdentifier) => u),
      },
    });

    const result = await service.setIdentity(referenceId, { gtin: VALID_GTIN13 });

    const savedArg = upiRepo.save.mock.calls[0][0] as UniqueProductIdentifier;
    expect(savedArg.uuid).toBe(existing.uuid);
    expect(savedArg.gs1).toEqual({ gtin: VALID_GTIN13_AS_14 });
    expect(result.uuid).toBe(existing.uuid);
    expect(result.batch).toBeNull();
    expect(result.serial).toBeNull();
  });

  it("rejects an invalid GTIN with a ValueError", async () => {
    const { service } = makeService();
    await expect(service.setIdentity(randomUUID(), { gtin: "4006381333930" })).rejects.toThrow(
      ValueError,
    );
  });

  it("rejects an invalid serial with a ValueError", async () => {
    const { service } = makeService({
      upiRepo: { findByReferenceIdAndType: jest.fn(async () => undefined) },
    });
    await expect(
      service.setIdentity(randomUUID(), { gtin: VALID_GTIN13, serial: "x".repeat(21) }),
    ).rejects.toThrow(ValueError);
  });

  it("builds the Digital Link against the per-organization resolver override", async () => {
    const referenceId = randomUUID();
    const organizationId = randomUUID();
    const { service } = makeService({
      upiRepo: {
        findByReferenceIdAndType: jest.fn(async () => undefined),
        save: jest.fn(async (u: UniqueProductIdentifier) => u),
      },
      brandingResolverBaseUrl: "https://id.acme.com",
    });

    const result = await service.setIdentity(referenceId, { gtin: VALID_GTIN13 }, organizationId);

    expect(result.digitalLink).toBe(`https://id.acme.com/01/${VALID_GTIN13_AS_14}`);
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
      digitalLink: `${RESOLVER_BASE}/01/${VALID_GTIN13_AS_14}/10/LOT-42/21/SN-001`,
    });
  });

  it("returns null when the passport has no GS1 identity", async () => {
    const { service } = makeService({
      upiRepo: { findByReferenceIdAndType: jest.fn(async () => undefined) },
    });
    expect(await service.getIdentity(randomUUID())).toBeNull();
  });

  it("builds the Digital Link against the configured instance resolver base", async () => {
    const referenceId = randomUUID();
    const organizationId = randomUUID();
    const upi = UniqueProductIdentifier.createGs1({ referenceId, gtin: VALID_GTIN13 });
    const { service } = makeService({
      upiRepo: { findByReferenceIdAndType: jest.fn(async () => upi) },
      instanceResolverBaseUrl: "https://id.instance.example.com",
    });

    const result = await service.getIdentity(referenceId, organizationId);

    expect(result?.digitalLink).toBe(`https://id.instance.example.com/01/${VALID_GTIN13_AS_14}`);
  });
});

describe("Gs1IdentityService.removeIdentity", () => {
  it("deletes only the GS1 row via the type-filtered repository delete", async () => {
    const referenceId = randomUUID();
    const { service, upiRepo } = makeService({
      upiRepo: { deleteByReferenceIdAndType: jest.fn(async () => undefined) },
    });

    await service.removeIdentity(referenceId);

    expect(upiRepo.deleteByReferenceIdAndType).toHaveBeenCalledTimes(1);
    expect(upiRepo.deleteByReferenceIdAndType).toHaveBeenCalledWith(
      referenceId,
      ExternalIdentifierType.GS1,
    );
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
    const permalink = { id: randomUUID() };
    const passport = { organizationId: randomUUID() };
    const { service, upiRepo } = makeService({
      upiRepo: { findByGs1Key: jest.fn(async () => upi) },
      permalinkRepo: { findAllByPassportId: jest.fn(async () => [permalink]) },
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

  it("404s when the passport has no permalink", async () => {
    const referenceId = randomUUID();
    const upi = UniqueProductIdentifier.createGs1({ referenceId, gtin: VALID_GTIN13 });
    const { service } = makeService({
      upiRepo: { findByGs1Key: jest.fn(async () => upi) },
      permalinkRepo: { findAllByPassportId: jest.fn(async () => []) },
    });
    await expect(service.resolveGs1KeyToPublicUrl({ gtin: VALID_GTIN13 })).rejects.toThrow(
      NotFoundException,
    );
  });

  it("resolves to the permalink public URL (publish-gated by resolveToPassport)", async () => {
    const referenceId = randomUUID();
    const upi = UniqueProductIdentifier.createGs1({ referenceId, gtin: VALID_GTIN13 });
    const permalink = { id: randomUUID() };
    const passport = { organizationId: randomUUID() };
    const branding = { permalinkBaseUrl: null };
    const { service, permalinkService } = makeService({
      upiRepo: { findByGs1Key: jest.fn(async () => upi) },
      permalinkRepo: { findAllByPassportId: jest.fn(async () => [permalink]) },
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
      permalinkRepo: { findAllByPassportId: jest.fn(async () => [permalink]) },
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
});
