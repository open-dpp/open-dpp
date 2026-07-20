/**
 * UpiCollectionService.list / listByPassport / permalink enrichment
 *
 * Pure-unit suite mirroring gs1-identity.service.spec makeService pattern.
 */
import { randomUUID } from "node:crypto";
import { describe, expect, it, jest } from "@jest/globals";
import { PagingResult } from "../../../pagination/paging-result";
import { Pagination } from "../../../pagination/pagination";
import { UniqueProductIdentifier } from "../../domain/unique.product.identifier";
import { UniqueProductIdentifierType } from "@open-dpp/dto";
import { UpiCollectionService } from "./upi-collection.service";

const VALID_GTIN13 = "4006381333931";
const VALID_GTIN13_AS_14 = "04006381333931";
const RESOLVER_BASE = "https://id.example.com";

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
    getGs1LinkSummariesByUpiIds: jest.Mock;
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
    getGs1LinkSummariesByUpiIds: jest.fn(async () => new Map()),
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
      type: UniqueProductIdentifierType.OPEN_DPP_UUID,
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
        findByIds: jest.fn(
          async () => new Map([[passportDraftId, makeDraftPassportStub(passportDraftId)]]),
        ),
      },
    });

    const result = await service.list(organizationId);

    expect(result.items).toHaveLength(2);
    expect(result.cursor).toBeNull();
    expect(passportRepo.findByIds).toHaveBeenCalledTimes(1);

    const gs1Item = result.items.find((item) => item.type === UniqueProductIdentifierType.GS1);
    const systemItem = result.items.find(
      (item) => item.type === UniqueProductIdentifierType.OPEN_DPP_UUID,
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
        findByIds: jest.fn(
          async () => new Map([[passportDraftId, makeDraftPassportStub(passportDraftId)]]),
        ),
      },
    });

    const result = await service.list(organizationId);

    const gs1Item = result.items.find((item) => item.type === UniqueProductIdentifierType.GS1);
    const systemItem = result.items.find(
      (item) => item.type === UniqueProductIdentifierType.OPEN_DPP_UUID,
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
        findByIds: jest.fn(
          async () => new Map([[passportDraftId, makeDraftPassportStub(passportDraftId)]]),
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
      type: UniqueProductIdentifierType.OPEN_DPP_UUID,
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
    const gs1Item = result.items.find((i) => i.type === UniqueProductIdentifierType.GS1);
    const systemItem = result.items.find((i) => i.type === UniqueProductIdentifierType.OPEN_DPP_UUID);
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
    const { service, passportRepo, baseUrlResolver } = makeService({
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
    expect(baseUrlResolver.getResolverBase).not.toHaveBeenCalled();
  });

  it("(d) threads limit/cursor to the repo, surfaces next cursor, resolves via the passport org", async () => {
    const gs1Upi = makeGs1Upi(referenceId);
    const findAllByReferencedIdPaginated = jest.fn(async () =>
      PagingResult.create({
        pagination: Pagination.create({ limit: 1, cursor: "next-cursor" }),
        items: [gs1Upi],
      }),
    );
    const { service, baseUrlResolver } = makeService({
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
    expect(baseUrlResolver.getResolverBase).toHaveBeenCalledWith(organizationId);
  });
});

describe("UpiCollectionService permalink enrichment", () => {
  const referenceId = randomUUID();
  const organizationId = randomUUID();

  function makeGs1Upi() {
    return UniqueProductIdentifier.createGs1({
      externalUUID: randomUUID(),
      referenceId,
      gtin: VALID_GTIN13,
      organizationId,
    });
  }
  function makeSystemUpi() {
    return UniqueProductIdentifier.create({
      externalUUID: randomUUID(),
      referenceId,
      type: UniqueProductIdentifierType.OPEN_DPP_UUID,
      organizationId,
    });
  }
  function makeDraftPassportStub(id: string) {
    return { id, organizationId, isDraft: () => true, isPublished: () => false };
  }

  it("list: GS1 row with a gs1-link permalink carries the summary; others null; one batched call with GS1 uuids only", async () => {
    const linkedUpi = makeGs1Upi();
    const unlinkedUpi = makeGs1Upi();
    const systemUpi = makeSystemUpi();
    const summary = { id: randomUUID(), publicUrl: "https://dpp.example.com/my-link" };

    const getGs1LinkSummariesByUpiIds = jest.fn(async () => new Map([[linkedUpi.uuid, summary]]));
    const { service } = makeService({
      upiRepo: {
        findAllByOrganizationId: jest.fn(async () =>
          PagingResult.create({
            pagination: Pagination.create({ limit: 100 }),
            items: [linkedUpi, unlinkedUpi, systemUpi],
          }),
        ),
      },
      passportRepo: {
        findByIds: jest.fn(
          async () => new Map([[referenceId, makeDraftPassportStub(referenceId)]]),
        ),
      },
      permalinkApplicationService: { getGs1LinkSummariesByUpiIds },
    });

    const result = await service.list(organizationId);

    expect(getGs1LinkSummariesByUpiIds).toHaveBeenCalledTimes(1);
    expect(getGs1LinkSummariesByUpiIds).toHaveBeenCalledWith(
      [linkedUpi.uuid, unlinkedUpi.uuid],
      organizationId,
    );
    const byUuid = new Map(result.items.map((i) => [i.uuid, i]));
    expect(byUuid.get(linkedUpi.uuid)!.permalink).toEqual(summary);
    expect(byUuid.get(unlinkedUpi.uuid)!.permalink).toBeNull();
    expect(byUuid.get(systemUpi.uuid)!.permalink).toBeNull();
  });

  it("listByPassport: enriches GS1 rows via one batched call scoped to the passport's org", async () => {
    const linkedUpi = makeGs1Upi();
    const systemUpi = makeSystemUpi();
    const summary = { id: randomUUID(), publicUrl: "https://dpp.example.com/my-link" };

    const getGs1LinkSummariesByUpiIds = jest.fn(async () => new Map([[linkedUpi.uuid, summary]]));
    const { service } = makeService({
      upiRepo: {
        findAllByReferencedIdPaginated: jest.fn(async () =>
          PagingResult.create({
            pagination: Pagination.create({ limit: 100 }),
            items: [linkedUpi, systemUpi],
          }),
        ),
      },
      passportRepo: { findOne: jest.fn(async () => makeDraftPassportStub(referenceId)) },
      permalinkApplicationService: { getGs1LinkSummariesByUpiIds },
    });

    const result = await service.listByPassport(referenceId);

    expect(getGs1LinkSummariesByUpiIds).toHaveBeenCalledTimes(1);
    expect(getGs1LinkSummariesByUpiIds).toHaveBeenCalledWith([linkedUpi.uuid], organizationId);
    const byUuid = new Map(result.items.map((i) => [i.uuid, i]));
    expect(byUuid.get(linkedUpi.uuid)!.permalink).toEqual(summary);
    expect(byUuid.get(systemUpi.uuid)!.permalink).toBeNull();
  });

  it("list: no GS1 rows on the page — the summary service is still called with an empty array (cheap no-op)", async () => {
    const systemUpi = makeSystemUpi();
    const getGs1LinkSummariesByUpiIds = jest.fn(async () => new Map());
    const { service } = makeService({
      upiRepo: {
        findAllByOrganizationId: jest.fn(async () =>
          PagingResult.create({
            pagination: Pagination.create({ limit: 100 }),
            items: [systemUpi],
          }),
        ),
      },
      passportRepo: {
        findByIds: jest.fn(
          async () => new Map([[referenceId, makeDraftPassportStub(referenceId)]]),
        ),
      },
      permalinkApplicationService: { getGs1LinkSummariesByUpiIds },
    });

    const result = await service.list(organizationId);

    expect(getGs1LinkSummariesByUpiIds).toHaveBeenCalledWith([], organizationId);
    expect(result.items[0].permalink).toBeNull();
  });
});
