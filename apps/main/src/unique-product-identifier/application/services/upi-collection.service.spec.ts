/**
 * Slices 32, 33 & 34: UpiCollectionService.create / update / delete / list
 *
 * Pure-unit suite mirroring gs1-identity.service.spec makeService pattern.
 */
import { randomUUID } from "node:crypto";
import { describe, expect, it, jest } from "@jest/globals";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { ValueError } from "@open-dpp/exception";
import { PagingResult } from "../../../pagination/paging-result";
import { Pagination } from "../../../pagination/pagination";
import { UniqueProductIdentifier } from "../../domain/unique.product.identifier";
import { ExternalIdentifierType } from "../../presentation/dto/unique-product-identifier-dto.schema";
import { UpiCollectionService } from "./upi-collection.service";

const VALID_GTIN13 = "4006381333931";
const VALID_GTIN13_AS_14 = "04006381333931";
const RESOLVER_BASE = "https://id.example.com";

function makeDraftPassport(id: string) {
  return {
    id,
    organizationId: randomUUID(),
    isDraft: jest.fn(() => true),
    isPublished: jest.fn(() => false),
  };
}

function makePublishedPassport(id: string) {
  return {
    id,
    organizationId: randomUUID(),
    isDraft: jest.fn(() => false),
    isPublished: jest.fn(() => true),
  };
}

function makeService(overrides?: {
  upiRepo?: Partial<{
    save: jest.Mock;
    findOneOrFail: jest.Mock;
    deleteById: jest.Mock;
    findAllByOrganizationId: jest.Mock;
    findAllByReferencedIdPaginated: jest.Mock;
  }>;
  passportRepo?: Partial<{
    findOne: jest.Mock;
    findByIds: jest.Mock;
  }>;
  gs1ResolverBaseService?: Partial<{
    getResolverBase: jest.Mock;
  }>;
}) {
  const upiRepo = {
    save: jest.fn(async (upi: UniqueProductIdentifier) => upi),
    findOneOrFail: jest.fn(async () => {
      throw new Error("findOneOrFail not configured");
    }),
    deleteById: jest.fn(async () => undefined),
    findAllByOrganizationId: jest.fn(async () =>
      PagingResult.create({ pagination: Pagination.create({ limit: 100 }), items: [] }),
    ),
    findAllByReferencedIdPaginated: jest.fn(async () =>
      PagingResult.create({ pagination: Pagination.create({ limit: 100 }), items: [] }),
    ),
    ...overrides?.upiRepo,
  };
  const passportRepo = {
    findOne: jest.fn(async () => undefined),
    findByIds: jest.fn(async () => new Map()),
    ...overrides?.passportRepo,
  };
  const gs1ResolverBaseService = {
    getResolverBase: jest.fn(async () => RESOLVER_BASE),
    ...overrides?.gs1ResolverBaseService,
  };
  const service = new UpiCollectionService(
    upiRepo as never,
    passportRepo as never,
    gs1ResolverBaseService as never,
  );
  return { service, upiRepo, passportRepo, gs1ResolverBaseService };
}

describe("UpiCollectionService.create", () => {
  it("(a) DRAFT passport — creates and saves a GS1 UPI, returns the response with digitalLink", async () => {
    const referenceId = randomUUID();
    const organizationId = randomUUID();
    const draftPassport = makeDraftPassport(referenceId);

    const { service, upiRepo } = makeService({
      passportRepo: {
        findOne: jest.fn(async () => draftPassport),
      },
    });

    const result = await service.create({
      referenceId,
      gtin: VALID_GTIN13,
      organizationId,
    });

    expect(upiRepo.save).toHaveBeenCalledTimes(1);
    const savedArg = upiRepo.save.mock.calls[0][0] as UniqueProductIdentifier;
    expect(savedArg.referenceId).toBe(referenceId);
    expect(savedArg.gs1?.gtin).toBe(VALID_GTIN13_AS_14);
    expect(result.referenceId).toBe(referenceId);
    expect(result.gtin).toBe(VALID_GTIN13_AS_14);
    expect(result.digitalLink).toBe(`${RESOLVER_BASE}/01/${VALID_GTIN13_AS_14}`);
  });

  it("(a) with batch and serial — returns the full Digital Link", async () => {
    const referenceId = randomUUID();
    const organizationId = randomUUID();
    const draftPassport = makeDraftPassport(referenceId);

    const { service } = makeService({
      passportRepo: {
        findOne: jest.fn(async () => draftPassport),
      },
    });

    const result = await service.create({
      referenceId,
      gtin: VALID_GTIN13,
      batch: "LOT-42",
      serial: "SN-001",
      organizationId,
    });

    expect(result.gtin).toBe(VALID_GTIN13_AS_14);
    expect(result.batch).toBe("LOT-42");
    expect(result.serial).toBe("SN-001");
    expect(result.digitalLink).toBe(
      `${RESOLVER_BASE}/01/${VALID_GTIN13_AS_14}/10/LOT-42/21/SN-001`,
    );
  });

  it("(b) PUBLISHED passport → ConflictException, no save", async () => {
    const referenceId = randomUUID();
    const publishedPassport = makePublishedPassport(referenceId);

    const { service, upiRepo } = makeService({
      passportRepo: {
        findOne: jest.fn(async () => publishedPassport),
      },
    });

    await expect(
      service.create({ referenceId, gtin: VALID_GTIN13, organizationId: randomUUID() }),
    ).rejects.toThrow(ConflictException);

    expect(upiRepo.save).not.toHaveBeenCalled();
  });

  it("(c) passport not found → NotFoundException, no save", async () => {
    const { service, upiRepo } = makeService({
      passportRepo: {
        findOne: jest.fn(async () => undefined),
      },
    });

    await expect(
      service.create({ referenceId: randomUUID(), gtin: VALID_GTIN13, organizationId: randomUUID() }),
    ).rejects.toThrow(NotFoundException);

    expect(upiRepo.save).not.toHaveBeenCalled();
  });

  it("(d) repo.save throws a duplicate-key error → ConflictException with 'GS1 identity already assigned'", async () => {
    const referenceId = randomUUID();
    const draftPassport = makeDraftPassport(referenceId);
    // Simulate a MongoDB duplicate key error (code 11000)
    const dupKeyError = Object.assign(new Error("Duplicate key"), { code: 11000 });

    const { service } = makeService({
      passportRepo: {
        findOne: jest.fn(async () => draftPassport),
      },
      upiRepo: {
        save: jest.fn(async () => {
          throw dupKeyError;
        }),
      },
    });

    const err = await service
      .create({ referenceId, gtin: VALID_GTIN13, organizationId: randomUUID() })
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ConflictException);
    expect((err as ConflictException).message).toContain("GS1 identity already assigned");
  });

  it("(e) invalid GTIN → ValueError, no save", async () => {
    const referenceId = randomUUID();
    const draftPassport = makeDraftPassport(referenceId);

    const { service, upiRepo } = makeService({
      passportRepo: {
        findOne: jest.fn(async () => draftPassport),
      },
    });

    await expect(
      service.create({
        referenceId,
        gtin: "4006381333930", // bad check digit
        organizationId: randomUUID(),
      }),
    ).rejects.toThrow(ValueError);

    expect(upiRepo.save).not.toHaveBeenCalled();
  });

  it("passes organizationId to getResolverBase for the digital link cascade", async () => {
    const referenceId = randomUUID();
    const organizationId = randomUUID();
    const draftPassport = makeDraftPassport(referenceId);

    const { service, gs1ResolverBaseService } = makeService({
      passportRepo: {
        findOne: jest.fn(async () => draftPassport),
      },
    });

    await service.create({ referenceId, gtin: VALID_GTIN13, organizationId });

    expect(gs1ResolverBaseService.getResolverBase).toHaveBeenCalledWith(organizationId);
  });
});

// ---------------------------------------------------------------------------
// Slice 33 — UpiCollectionService.update / delete
// ---------------------------------------------------------------------------

describe("UpiCollectionService.update", () => {
  const referenceId = randomUUID();
  const upiUuid = randomUUID();

  function makeGs1Upi(overrides?: Partial<{ batch: string; serial: string }>) {
    return UniqueProductIdentifier.createGs1({
      externalUUID: upiUuid,
      referenceId,
      gtin: VALID_GTIN13,
      organizationId: randomUUID(),
      ...overrides,
    });
  }

  function makeSystemUpi() {
    return UniqueProductIdentifier.create({
      externalUUID: upiUuid,
      referenceId,
      type: ExternalIdentifierType.OPEN_DPP_UUID,
      organizationId: randomUUID(),
    });
  }

  it("(a) DRAFT passport → loads UPI, calls withGs1, saves, returns updated response", async () => {
    const existingUpi = makeGs1Upi({ batch: "OLD-BATCH" });
    const draftPassport = makeDraftPassport(referenceId);

    const { service, upiRepo, passportRepo } = makeService({
      upiRepo: {
        findOneOrFail: jest.fn(async () => existingUpi),
        save: jest.fn(async (upi: UniqueProductIdentifier) => upi),
      },
      passportRepo: {
        findOne: jest.fn(async () => draftPassport),
      },
    });

    const result = await service.update(upiUuid, {
      gtin: VALID_GTIN13,
      batch: "NEW-BATCH",
    });

    expect(upiRepo.findOneOrFail).toHaveBeenCalledWith(upiUuid);
    expect(passportRepo.findOne).toHaveBeenCalledWith(referenceId);
    expect(upiRepo.save).toHaveBeenCalledTimes(1);
    const savedArg = upiRepo.save.mock.calls[0][0] as UniqueProductIdentifier;
    expect(savedArg.gs1?.batch).toBe("NEW-BATCH");
    expect(savedArg.gs1?.gtin).toBe(VALID_GTIN13_AS_14);
    expect(result.gtin).toBe(VALID_GTIN13_AS_14);
    expect(result.batch).toBe("NEW-BATCH");
  });

  it("(b) PUBLISHED passport → ConflictException, no save", async () => {
    const existingUpi = makeGs1Upi();
    const publishedPassport = makePublishedPassport(referenceId);

    const { service, upiRepo } = makeService({
      upiRepo: {
        findOneOrFail: jest.fn(async () => existingUpi),
        save: jest.fn(async (upi: UniqueProductIdentifier) => upi),
      },
      passportRepo: {
        findOne: jest.fn(async () => publishedPassport),
      },
    });

    await expect(
      service.update(upiUuid, { gtin: VALID_GTIN13 }),
    ).rejects.toThrow(ConflictException);

    expect(upiRepo.save).not.toHaveBeenCalled();
  });

  it("(c) duplicate resulting key → ConflictException", async () => {
    const existingUpi = makeGs1Upi();
    const draftPassport = makeDraftPassport(referenceId);
    const dupKeyError = Object.assign(new Error("Duplicate key"), { code: 11000 });

    const { service } = makeService({
      upiRepo: {
        findOneOrFail: jest.fn(async () => existingUpi),
        save: jest.fn(async () => {
          throw dupKeyError;
        }),
      },
      passportRepo: {
        findOne: jest.fn(async () => draftPassport),
      },
    });

    const err = await service
      .update(upiUuid, { gtin: VALID_GTIN13 })
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ConflictException);
  });

  it("(f) updating a non-GS1 (OPEN_DPP_UUID) UPI → ConflictException, no save", async () => {
    const systemUpi = makeSystemUpi();

    const { service, upiRepo } = makeService({
      upiRepo: {
        findOneOrFail: jest.fn(async () => systemUpi),
        save: jest.fn(async (upi: UniqueProductIdentifier) => upi),
      },
      passportRepo: {
        findOne: jest.fn(async () => makeDraftPassport(referenceId)),
      },
    });

    await expect(
      service.update(upiUuid, { gtin: VALID_GTIN13 }),
    ).rejects.toThrow(ConflictException);

    expect(upiRepo.save).not.toHaveBeenCalled();
  });

  it("(g) missing UPI → NotFoundException", async () => {
    const { NotFoundInDatabaseException } = await import("@open-dpp/exception");
    const notFoundError = new NotFoundInDatabaseException("UniqueProductIdentifier");

    const { service } = makeService({
      upiRepo: {
        findOneOrFail: jest.fn(async () => {
          throw notFoundError;
        }),
      },
    });

    await expect(service.update(upiUuid, { gtin: VALID_GTIN13 })).rejects.toThrow(NotFoundException);
  });
});

describe("UpiCollectionService.delete", () => {
  const referenceId = randomUUID();
  const upiUuid = randomUUID();

  function makeGs1Upi() {
    return UniqueProductIdentifier.createGs1({
      externalUUID: upiUuid,
      referenceId,
      gtin: VALID_GTIN13,
      organizationId: randomUUID(),
    });
  }

  function makeSystemUpi() {
    return UniqueProductIdentifier.create({
      externalUUID: upiUuid,
      referenceId,
      type: ExternalIdentifierType.OPEN_DPP_UUID,
      organizationId: randomUUID(),
    });
  }

  it("(d) DRAFT passport → deleteById called with UPI uuid, no siblings affected", async () => {
    const existingUpi = makeGs1Upi();
    const draftPassport = makeDraftPassport(referenceId);

    const { service, upiRepo } = makeService({
      upiRepo: {
        findOneOrFail: jest.fn(async () => existingUpi),
        deleteById: jest.fn(async () => undefined),
      },
      passportRepo: {
        findOne: jest.fn(async () => draftPassport),
      },
    });

    await service.delete(upiUuid);

    // Must use deleteById with the single UPI uuid — NOT deleteByReferenceIdAndType
    expect(upiRepo.deleteById).toHaveBeenCalledWith(upiUuid);
    expect(upiRepo.deleteById).toHaveBeenCalledTimes(1);
  });

  it("(e) PUBLISHED passport → ConflictException, no delete", async () => {
    const existingUpi = makeGs1Upi();
    const publishedPassport = makePublishedPassport(referenceId);

    const { service, upiRepo } = makeService({
      upiRepo: {
        findOneOrFail: jest.fn(async () => existingUpi),
        deleteById: jest.fn(async () => undefined),
      },
      passportRepo: {
        findOne: jest.fn(async () => publishedPassport),
      },
    });

    await expect(service.delete(upiUuid)).rejects.toThrow(ConflictException);

    expect(upiRepo.deleteById).not.toHaveBeenCalled();
  });

  it("(f) deleting a non-GS1 (OPEN_DPP_UUID) UPI → ConflictException, no delete", async () => {
    const systemUpi = makeSystemUpi();

    const { service, upiRepo } = makeService({
      upiRepo: {
        findOneOrFail: jest.fn(async () => systemUpi),
        deleteById: jest.fn(async () => undefined),
      },
      passportRepo: {
        findOne: jest.fn(async () => makeDraftPassport(referenceId)),
      },
    });

    await expect(service.delete(upiUuid)).rejects.toThrow(ConflictException);

    expect(upiRepo.deleteById).not.toHaveBeenCalled();
  });

  it("(g) missing UPI → NotFoundException", async () => {
    const { NotFoundInDatabaseException } = await import("@open-dpp/exception");
    const notFoundError = new NotFoundInDatabaseException("UniqueProductIdentifier");

    const { service } = makeService({
      upiRepo: {
        findOneOrFail: jest.fn(async () => {
          throw notFoundError;
        }),
      },
    });

    await expect(service.delete(upiUuid)).rejects.toThrow(NotFoundException);
  });
});

// ---------------------------------------------------------------------------
// Slice 34 — UpiCollectionService.list
// ---------------------------------------------------------------------------

describe("UpiCollectionService.list", () => {
  const organizationId = randomUUID();
  const otherOrganizationId = randomUUID();

  const passportDraftId = randomUUID();
  const passportPublishedId = randomUUID();

  function makeGs1Upi(referenceId: string, overrides?: Partial<{ batch: string; serial: string }>) {
    return UniqueProductIdentifier.createGs1({
      externalUUID: randomUUID(),
      referenceId,
      gtin: VALID_GTIN13,
      organizationId,
      ...overrides,
    });
  }

  function makeSystemUpi(referenceId: string) {
    return UniqueProductIdentifier.create({
      externalUUID: randomUUID(),
      referenceId,
      type: ExternalIdentifierType.OPEN_DPP_UUID,
      organizationId,
    });
  }

  function makeDraftPassportStub(id: string) {
    return {
      id,
      isDraft: jest.fn(() => true),
      isPublished: jest.fn(() => false),
    };
  }

  function makePublishedPassportStub(id: string) {
    return {
      id,
      isDraft: jest.fn(() => false),
      isPublished: jest.fn(() => true),
    };
  }

  it("(a) returns every UPI of the org (GS1 + system) mapped to list items", async () => {
    const gs1Upi = makeGs1Upi(passportDraftId);
    const systemUpi = makeSystemUpi(passportDraftId);

    const { service, passportRepo } = makeService({
      upiRepo: {
        findAllByOrganizationId: jest.fn(async () =>
          PagingResult.create({
            pagination: Pagination.create({ limit: 100 }),
            items: [gs1Upi, systemUpi],
          }),
        ),
      },
      passportRepo: {
        findByIds: jest.fn(async () =>
          new Map([[passportDraftId, makeDraftPassportStub(passportDraftId)]]),
        ),
      },
    });

    const result = await service.list(organizationId);

    expect(result.items).toHaveLength(2);
    expect(result.cursor).toBeNull();
    expect(passportRepo.findByIds).toHaveBeenCalledTimes(1);

    const gs1Item = result.items.find((item) => item.type === ExternalIdentifierType.GS1);
    const systemItem = result.items.find(
      (item) => item.type === ExternalIdentifierType.OPEN_DPP_UUID,
    );

    expect(gs1Item).toBeDefined();
    expect(gs1Item!.uuid).toBe(gs1Upi.uuid);
    expect(gs1Item!.referenceId).toBe(passportDraftId);
    expect(gs1Item!.gtin).toBe(VALID_GTIN13_AS_14);
    expect(gs1Item!.digitalLink).toBe(`${RESOLVER_BASE}/01/${VALID_GTIN13_AS_14}`);

    expect(systemItem).toBeDefined();
    expect(systemItem!.uuid).toBe(systemUpi.uuid);
    expect(systemItem!.digitalLink).toBeNull();
  });

  it("(b) system rows are read-only, GS1 rows are editable (passportPublished=false for draft)", async () => {
    const gs1Upi = makeGs1Upi(passportDraftId);
    const systemUpi = makeSystemUpi(passportDraftId);

    const { service } = makeService({
      upiRepo: {
        findAllByOrganizationId: jest.fn(async () =>
          PagingResult.create({
            pagination: Pagination.create({ limit: 100 }),
            items: [gs1Upi, systemUpi],
          }),
        ),
      },
      passportRepo: {
        findByIds: jest.fn(async () =>
          new Map([[passportDraftId, makeDraftPassportStub(passportDraftId)]]),
        ),
      },
    });

    const result = await service.list(organizationId);

    const gs1Item = result.items.find((item) => item.type === ExternalIdentifierType.GS1);
    const systemItem = result.items.find(
      (item) => item.type === ExternalIdentifierType.OPEN_DPP_UUID,
    );

    // passportPublished=false for draft → editable
    expect(gs1Item!.passportPublished).toBe(false);
    expect(systemItem!.passportPublished).toBe(false);
  });

  it("(c) other orgs excluded — list is org-scoped via findAllByOrganizationId", async () => {
    const gs1Upi = makeGs1Upi(passportDraftId);

    const { service, upiRepo } = makeService({
      upiRepo: {
        findAllByOrganizationId: jest.fn(async (id: string) => {
          if (id === organizationId) {
            return PagingResult.create({
              pagination: Pagination.create({ limit: 100 }),
              items: [gs1Upi],
            });
          }
          return PagingResult.create({
            pagination: Pagination.create({ limit: 100 }),
            items: [],
          });
        }),
      },
      passportRepo: {
        findByIds: jest.fn(async () =>
          new Map([[passportDraftId, makeDraftPassportStub(passportDraftId)]]),
        ),
      },
    });

    const resultForOrg = await service.list(organizationId);
    const resultForOther = await service.list(otherOrganizationId);

    expect(resultForOrg.items).toHaveLength(1);
    expect(resultForOther.items).toHaveLength(0);

    // findAllByOrganizationId called with the correct org on each call
    expect(upiRepo.findAllByOrganizationId).toHaveBeenNthCalledWith(
      1,
      organizationId,
      expect.anything(),
    );
    expect(upiRepo.findAllByOrganizationId).toHaveBeenNthCalledWith(
      2,
      otherOrganizationId,
      expect.anything(),
    );
  });

  it("(d) empty when none", async () => {
    const { service } = makeService({
      upiRepo: {
        findAllByOrganizationId: jest.fn(async () =>
          PagingResult.create({
            pagination: Pagination.create({ limit: 100 }),
            items: [],
          }),
        ),
      },
    });

    const result = await service.list(organizationId);
    expect(result.items).toHaveLength(0);
  });

  it("(e) passportPublished correctness — published-passport UPI has passportPublished:true, draft:false", async () => {
    const publishedUpi = UniqueProductIdentifier.createGs1({
      externalUUID: randomUUID(),
      referenceId: passportPublishedId,
      gtin: VALID_GTIN13,
      organizationId,
    });
    const draftUpi = UniqueProductIdentifier.createGs1({
      externalUUID: randomUUID(),
      referenceId: passportDraftId,
      gtin: VALID_GTIN13,
      organizationId,
    });

    const passportMap = new Map<string, any>([
      [passportPublishedId, makePublishedPassportStub(passportPublishedId)],
      [passportDraftId, makeDraftPassportStub(passportDraftId)],
    ]);

    const { service, passportRepo } = makeService({
      upiRepo: {
        findAllByOrganizationId: jest.fn(async () =>
          PagingResult.create({
            pagination: Pagination.create({ limit: 100 }),
            items: [publishedUpi, draftUpi],
          }),
        ),
      },
      passportRepo: {
        findByIds: jest.fn(async () => passportMap),
      },
    });

    const result = await service.list(organizationId);

    const publishedItem = result.items.find((item) => item.referenceId === passportPublishedId);
    const draftItem = result.items.find((item) => item.referenceId === passportDraftId);

    expect(publishedItem).toBeDefined();
    expect(publishedItem!.passportPublished).toBe(true);

    expect(draftItem).toBeDefined();
    expect(draftItem!.passportPublished).toBe(false);

    // Only ONE passport query per list() call — no N+1
    expect(passportRepo.findByIds).toHaveBeenCalledTimes(1);
    const calledWithIds = (passportRepo.findByIds.mock.calls[0] as [string[]])[0];
    expect(calledWithIds).toHaveLength(2);
    expect(calledWithIds).toContain(passportPublishedId);
    expect(calledWithIds).toContain(passportDraftId);
  });

  it("(f) threads limit/cursor to the repo and surfaces the repo's next cursor", async () => {
    const gs1Upi = makeGs1Upi(passportDraftId);
    const findAllByOrganizationId = jest.fn(async () =>
      PagingResult.create({
        pagination: Pagination.create({ limit: 1, cursor: "next-cursor" }),
        items: [gs1Upi],
      }),
    );

    const { service } = makeService({
      upiRepo: { findAllByOrganizationId },
      passportRepo: {
        findByIds: jest.fn(
          async () => new Map([[passportDraftId, makeDraftPassportStub(passportDraftId)]]),
        ),
      },
    });

    const result = await service.list(
      organizationId,
      Pagination.create({ limit: 1, cursor: "the-cursor" }),
    );

    // The incoming pagination is forwarded verbatim to the repository.
    expect(findAllByOrganizationId).toHaveBeenCalledWith(organizationId, {
      pagination: { limit: 1, cursor: "the-cursor" },
    });
    // The repo's advanced cursor is surfaced on the result.
    expect(result.cursor).toBe("next-cursor");
    expect(result.items).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Passport-scoped list — UpiCollectionService.listByPassport
// ---------------------------------------------------------------------------

describe("UpiCollectionService.listByPassport", () => {
  const referenceId = randomUUID();
  const organizationId = randomUUID();

  function makeGs1Upi(ref: string) {
    return UniqueProductIdentifier.createGs1({
      externalUUID: randomUUID(),
      referenceId: ref,
      gtin: VALID_GTIN13,
      organizationId,
    });
  }
  function makeSystemUpi(ref: string) {
    return UniqueProductIdentifier.create({
      externalUUID: randomUUID(),
      referenceId: ref,
      type: ExternalIdentifierType.OPEN_DPP_UUID,
      organizationId,
    });
  }
  function makeDraftPassportStub(id: string) {
    return { id, organizationId, isDraft: () => true, isPublished: () => false };
  }
  function makePublishedPassportStub(id: string) {
    return { id, organizationId, isDraft: () => false, isPublished: () => true };
  }

  it("(a) returns the passport's UPIs (GS1 + system) mapped to list items, cursor null", async () => {
    const gs1Upi = makeGs1Upi(referenceId);
    const systemUpi = makeSystemUpi(referenceId);
    const { service } = makeService({
      upiRepo: {
        findAllByReferencedIdPaginated: jest.fn(async () =>
          PagingResult.create({
            pagination: Pagination.create({ limit: 100 }),
            items: [gs1Upi, systemUpi],
          }),
        ),
      },
      passportRepo: { findOne: jest.fn(async () => makeDraftPassportStub(referenceId)) },
    });

    const result = await service.listByPassport(referenceId);

    expect(result.items).toHaveLength(2);
    expect(result.cursor).toBeNull();
    const gs1Item = result.items.find((i) => i.type === ExternalIdentifierType.GS1);
    const systemItem = result.items.find((i) => i.type === ExternalIdentifierType.OPEN_DPP_UUID);
    expect(gs1Item!.uuid).toBe(gs1Upi.uuid);
    expect(gs1Item!.referenceId).toBe(referenceId);
    expect(gs1Item!.gtin).toBe(VALID_GTIN13_AS_14);
    expect(gs1Item!.digitalLink).toBe(`${RESOLVER_BASE}/01/${VALID_GTIN13_AS_14}`);
    expect(systemItem!.digitalLink).toBeNull();
  });

  it("(b) passportPublished reflects the passport state via a single passport load", async () => {
    const gs1Upi = makeGs1Upi(referenceId);
    const { service, passportRepo } = makeService({
      upiRepo: {
        findAllByReferencedIdPaginated: jest.fn(async () =>
          PagingResult.create({
            pagination: Pagination.create({ limit: 100 }),
            items: [gs1Upi],
          }),
        ),
      },
      passportRepo: { findOne: jest.fn(async () => makePublishedPassportStub(referenceId)) },
    });

    const result = await service.listByPassport(referenceId);

    expect(result.items[0].passportPublished).toBe(true);
    expect(passportRepo.findOne).toHaveBeenCalledTimes(1);
    expect(passportRepo.findOne).toHaveBeenCalledWith(referenceId);
  });

  it("(c) empty when the passport has no UPIs — no passport/resolver lookups", async () => {
    const { service, passportRepo, gs1ResolverBaseService } = makeService({
      upiRepo: {
        findAllByReferencedIdPaginated: jest.fn(async () =>
          PagingResult.create({ pagination: Pagination.create({ limit: 100 }), items: [] }),
        ),
      },
    });

    const result = await service.listByPassport(referenceId);

    expect(result.items).toHaveLength(0);
    expect(result.cursor).toBeNull();
    expect(passportRepo.findOne).not.toHaveBeenCalled();
    expect(gs1ResolverBaseService.getResolverBase).not.toHaveBeenCalled();
  });

  it("(d) threads limit/cursor to the repo, surfaces next cursor, resolves via the passport org", async () => {
    const gs1Upi = makeGs1Upi(referenceId);
    const findAllByReferencedIdPaginated = jest.fn(async () =>
      PagingResult.create({
        pagination: Pagination.create({ limit: 1, cursor: "next-cursor" }),
        items: [gs1Upi],
      }),
    );
    const { service, gs1ResolverBaseService } = makeService({
      upiRepo: { findAllByReferencedIdPaginated },
      passportRepo: { findOne: jest.fn(async () => makeDraftPassportStub(referenceId)) },
    });

    const result = await service.listByPassport(
      referenceId,
      Pagination.create({ limit: 1, cursor: "the-cursor" }),
    );

    expect(findAllByReferencedIdPaginated).toHaveBeenCalledWith(referenceId, {
      pagination: { limit: 1, cursor: "the-cursor" },
    });
    expect(result.cursor).toBe("next-cursor");
    expect(gs1ResolverBaseService.getResolverBase).toHaveBeenCalledWith(organizationId);
  });
});
