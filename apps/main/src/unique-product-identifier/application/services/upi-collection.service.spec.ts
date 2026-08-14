import { randomUUID } from "node:crypto";
import { describe, expect, it, jest } from "@jest/globals";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { ValueError } from "@open-dpp/exception";
import { uniqueProductIdentifierUpdateRequestPlainFactory } from "@open-dpp/testing";
import { PagingResult } from "../../../pagination/paging-result";
import { Pagination } from "../../../pagination/pagination";
import { UniqueProductIdentifier } from "../../domain/unique.product.identifier";
import { UniqueProductIdentifierType } from "@open-dpp/dto";
import { UpiCollectionService } from "./upi-collection.service";

const VALID_GTIN13 = "4006381333931";
const VALID_GTIN13_AS_14 = "04006381333931";
const RESOLVER_BASE = "https://id.example.com/p";
const RESOLVER_ORIGIN = "https://id.example.com";

function makeDraftPassport(id: string) {
  return {
    id,
    organizationId: randomUUID(),
    isDraft: jest.fn(() => true),
    isPublished: jest.fn(() => false),
    isArchived: jest.fn(() => false),
  };
}

function makePublishedPassport(id: string) {
  return {
    id,
    organizationId: randomUUID(),
    isDraft: jest.fn(() => false),
    isPublished: jest.fn(() => true),
    isArchived: jest.fn(() => false),
  };
}

function makeArchivedPassport(id: string) {
  return {
    id,
    organizationId: randomUUID(),
    isDraft: jest.fn(() => false),
    isPublished: jest.fn(() => false),
    isArchived: jest.fn(() => true),
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
  baseUrlResolver?: Partial<{
    getResolverBase: jest.Mock;
  }>;
  permalinkApplicationService?: Partial<{
    getPermalinkSummariesByUpiIds: jest.Mock;
    deleteGs1LinkForUpi: jest.Mock;
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
  const baseUrlResolver = {
    getResolverBase: jest.fn(async () => RESOLVER_BASE),
    ...overrides?.baseUrlResolver,
  };
  const permalinkApplicationService = {
    getPermalinkSummariesByUpiIds: jest.fn(async () => new Map()),
    deleteGs1LinkForUpi: jest.fn(async () => undefined),
    ...overrides?.permalinkApplicationService,
  };
  const service = new UpiCollectionService(
    upiRepo as never,
    passportRepo as never,
    baseUrlResolver as never,
    permalinkApplicationService as never,
  );
  return { service, upiRepo, passportRepo, baseUrlResolver, permalinkApplicationService };
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
    expect(result.digitalLink).toBe(`${RESOLVER_ORIGIN}/01/${VALID_GTIN13_AS_14}`);
    expect(result.type).toBe(UniqueProductIdentifierType.GS1);
    expect(result.passportPublished).toBe(false);
    expect(result.permalink).toBeNull();
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
      `${RESOLVER_ORIGIN}/01/${VALID_GTIN13_AS_14}/10/LOT-42/21/SN-001`,
    );
  });

  it("(b) PUBLISHED passport — creates the UPI and flags passportPublished", async () => {
    const referenceId = randomUUID();
    const publishedPassport = makePublishedPassport(referenceId);

    const { service, upiRepo } = makeService({
      passportRepo: {
        findOne: jest.fn(async () => publishedPassport),
      },
    });

    const result = await service.create({
      referenceId,
      gtin: VALID_GTIN13,
      organizationId: randomUUID(),
    });

    expect(upiRepo.save).toHaveBeenCalledTimes(1);
    expect(result.gtin).toBe(VALID_GTIN13_AS_14);
    expect(result.passportPublished).toBe(true);
  });

  it("(b2) ARCHIVED passport → ConflictException, no save", async () => {
    const referenceId = randomUUID();
    const archivedPassport = makeArchivedPassport(referenceId);

    const { service, upiRepo } = makeService({
      passportRepo: {
        findOne: jest.fn(async () => archivedPassport),
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
      service.create({
        referenceId: randomUUID(),
        gtin: VALID_GTIN13,
        organizationId: randomUUID(),
      }),
    ).rejects.toThrow(NotFoundException);

    expect(upiRepo.save).not.toHaveBeenCalled();
  });

  it("(d) repo.save throws a duplicate-key error → ConflictException with 'GS1 identity already assigned'", async () => {
    const referenceId = randomUUID();
    const draftPassport = makeDraftPassport(referenceId);
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
        gtin: "4006381333930",
        organizationId: randomUUID(),
      }),
    ).rejects.toThrow(ValueError);

    expect(upiRepo.save).not.toHaveBeenCalled();
  });

  it("passes organizationId to getResolverBase for the digital link cascade", async () => {
    const referenceId = randomUUID();
    const organizationId = randomUUID();
    const draftPassport = makeDraftPassport(referenceId);

    const { service, baseUrlResolver } = makeService({
      passportRepo: {
        findOne: jest.fn(async () => draftPassport),
      },
    });

    await service.create({ referenceId, gtin: VALID_GTIN13, organizationId });

    expect(baseUrlResolver.getResolverBase).toHaveBeenCalledWith(organizationId);
  });
});

describe("UpiCollectionService.createInternal", () => {
  it("(a) DRAFT passport — creates an internal (OPEN_DPP_UUID) UPI with no GS1 data", async () => {
    const referenceId = randomUUID();
    const organizationId = randomUUID();
    const draftPassport = makeDraftPassport(referenceId);

    const { service, upiRepo } = makeService({
      passportRepo: { findOne: jest.fn(async () => draftPassport) },
    });

    const result = await service.createInternal({ referenceId, organizationId });

    expect(upiRepo.save).toHaveBeenCalledTimes(1);
    const savedArg = upiRepo.save.mock.calls[0][0] as UniqueProductIdentifier;
    expect(savedArg.type).toBe(UniqueProductIdentifierType.OPEN_DPP_UUID);
    expect(savedArg.gs1).toBeUndefined();
    expect(result.type).toBe(UniqueProductIdentifierType.OPEN_DPP_UUID);
    expect(result.gtin).toBeNull();
    expect(result.digitalLink).toBeNull();
  });

  it("(b) PUBLISHED passport — creates the internal UPI and flags passportPublished", async () => {
    const referenceId = randomUUID();
    const publishedPassport = makePublishedPassport(referenceId);
    const { service, upiRepo } = makeService({
      passportRepo: { findOne: jest.fn(async () => publishedPassport) },
    });

    const result = await service.createInternal({ referenceId, organizationId: randomUUID() });

    expect(upiRepo.save).toHaveBeenCalledTimes(1);
    expect(result.type).toBe(UniqueProductIdentifierType.OPEN_DPP_UUID);
    expect(result.passportPublished).toBe(true);
  });

  it("(b2) ARCHIVED passport → ConflictException, no save", async () => {
    const referenceId = randomUUID();
    const archivedPassport = makeArchivedPassport(referenceId);
    const { service, upiRepo } = makeService({
      passportRepo: { findOne: jest.fn(async () => archivedPassport) },
    });

    await expect(
      service.createInternal({ referenceId, organizationId: randomUUID() }),
    ).rejects.toThrow(ConflictException);
    expect(upiRepo.save).not.toHaveBeenCalled();
  });

  it("(c) passport not found → NotFoundException, no save", async () => {
    const { service, upiRepo } = makeService({
      passportRepo: { findOne: jest.fn(async () => undefined) },
    });

    await expect(
      service.createInternal({ referenceId: randomUUID(), organizationId: randomUUID() }),
    ).rejects.toThrow(NotFoundException);
    expect(upiRepo.save).not.toHaveBeenCalled();
  });
});

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
      type: UniqueProductIdentifierType.OPEN_DPP_UUID,
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

    const updateRequest = uniqueProductIdentifierUpdateRequestPlainFactory.build(
      {},
      { transient: { batch: "NEW-BATCH" } },
    );
    const result = await service.update(upiUuid, updateRequest);

    expect(upiRepo.findOneOrFail).toHaveBeenCalledWith(upiUuid);
    expect(passportRepo.findOne).toHaveBeenCalledWith(referenceId);
    expect(upiRepo.save).toHaveBeenCalledTimes(1);
    const savedArg = upiRepo.save.mock.calls[0][0] as UniqueProductIdentifier;
    expect(savedArg.gs1?.batch).toBe("NEW-BATCH");
    expect(savedArg.gs1?.gtin).toBe(VALID_GTIN13_AS_14);
    expect(result.gtin).toBe(VALID_GTIN13_AS_14);
    expect(result.batch).toBe("NEW-BATCH");
    expect(result.type).toBe(UniqueProductIdentifierType.GS1);
    expect(result.passportPublished).toBe(false);
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

    const updateRequest = uniqueProductIdentifierUpdateRequestPlainFactory.build();
    await expect(service.update(upiUuid, updateRequest)).rejects.toThrow(ConflictException);

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

    const updateRequest = uniqueProductIdentifierUpdateRequestPlainFactory.build();
    const err = await service.update(upiUuid, updateRequest).catch((e: unknown) => e);
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

    const updateRequest = uniqueProductIdentifierUpdateRequestPlainFactory.build();
    await expect(service.update(upiUuid, updateRequest)).rejects.toThrow(ConflictException);

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

    const updateRequest = uniqueProductIdentifierUpdateRequestPlainFactory.build();
    await expect(service.update(upiUuid, updateRequest)).rejects.toThrow(NotFoundException);
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
      type: UniqueProductIdentifierType.OPEN_DPP_UUID,
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

  it("(f) deleting a read-only GTIN/EAN system row → ConflictException, no delete (ADR 0006)", async () => {
    const systemRow = UniqueProductIdentifier.create({
      externalUUID: upiUuid,
      referenceId,
      type: UniqueProductIdentifierType.GTIN,
      organizationId: randomUUID(),
    });

    const { service, upiRepo } = makeService({
      upiRepo: {
        findOneOrFail: jest.fn(async () => systemRow),
        deleteById: jest.fn(async () => undefined),
      },
      passportRepo: {
        findOne: jest.fn(async () => makeDraftPassport(referenceId)),
      },
    });

    await expect(service.delete(upiUuid)).rejects.toThrow(ConflictException);

    expect(upiRepo.deleteById).not.toHaveBeenCalled();
  });

  it("(h) deleting an internal (OPEN_DPP_UUID) UPI on a draft → deleteById called (ADR 0006)", async () => {
    const internalUpi = makeSystemUpi();

    const { service, upiRepo } = makeService({
      upiRepo: {
        findOneOrFail: jest.fn(async () => internalUpi),
        deleteById: jest.fn(async () => undefined),
      },
      passportRepo: {
        findOne: jest.fn(async () => makeDraftPassport(referenceId)),
      },
    });

    await service.delete(upiUuid);

    expect(upiRepo.deleteById).toHaveBeenCalledWith(upiUuid);
    expect(upiRepo.deleteById).toHaveBeenCalledTimes(1);
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

  it("(i) deleting a GS1 UPI cascades its gs1-link permalink before the row delete", async () => {
    const existingUpi = makeGs1Upi();
    const deleteGs1LinkForUpi = jest.fn(async () => undefined);

    const { service, upiRepo } = makeService({
      upiRepo: {
        findOneOrFail: jest.fn(async () => existingUpi),
        deleteById: jest.fn(async () => undefined),
      },
      passportRepo: { findOne: jest.fn(async () => makeDraftPassport(referenceId)) },
      permalinkApplicationService: { deleteGs1LinkForUpi },
    });

    await service.delete(upiUuid);

    expect(deleteGs1LinkForUpi).toHaveBeenCalledWith(upiUuid);
    expect(upiRepo.deleteById).toHaveBeenCalledWith(upiUuid);
  });

  it("(j) a published (frozen) gs1-link permalink blocks the UPI delete", async () => {
    const existingUpi = makeGs1Upi();
    const deleteGs1LinkForUpi = jest.fn(async () => {
      throw new ConflictException("published permalink");
    });

    const { service, upiRepo } = makeService({
      upiRepo: {
        findOneOrFail: jest.fn(async () => existingUpi),
        deleteById: jest.fn(async () => undefined),
      },
      passportRepo: { findOne: jest.fn(async () => makeDraftPassport(referenceId)) },
      permalinkApplicationService: { deleteGs1LinkForUpi },
    });

    await expect(service.delete(upiUuid)).rejects.toThrow(ConflictException);
    expect(upiRepo.deleteById).not.toHaveBeenCalled();
  });

  it("(k) deleting an internal UPI does not touch the permalink service", async () => {
    const internalUpi = makeSystemUpi();
    const deleteGs1LinkForUpi = jest.fn(async () => undefined);

    const { service } = makeService({
      upiRepo: {
        findOneOrFail: jest.fn(async () => internalUpi),
        deleteById: jest.fn(async () => undefined),
      },
      passportRepo: { findOne: jest.fn(async () => makeDraftPassport(referenceId)) },
      permalinkApplicationService: { deleteGs1LinkForUpi },
    });

    await service.delete(upiUuid);

    expect(deleteGs1LinkForUpi).not.toHaveBeenCalled();
  });
});
