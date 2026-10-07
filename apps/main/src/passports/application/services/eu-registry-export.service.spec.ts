import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { PermalinkKind } from "@open-dpp/dto";
import { NotFoundError, ValueError } from "@open-dpp/exception";
import { gs1DataAttributesPlainFactory, passportsPlainFactory } from "@open-dpp/testing";
import { DigitalProductDocumentStatus } from "../../../digital-product-document/domain/digital-product-document-status";
import { Pagination } from "../../../pagination/pagination";
import { PagingResult } from "../../../pagination/paging-result";
import { Permalink } from "../../../permalink/domain/permalink";
import { PermalinkRepository } from "../../../permalink/infrastructure/permalink.repository";
import { Period } from "../../../time/period";
import { Passport } from "../../domain/passport";
import { PassportRepository } from "../../infrastructure/passport.repository";
import { EuRegistryExportService } from "./eu-registry-export.service";

function passport(): Passport {
  return Passport.fromPlain(passportsPlainFactory.build());
}

function publishedOpenDpp(passportId: string, createdAt = new Date("2026-01-01")) {
  return Permalink.create({ passportId, createdAt }).withPublishedUrl(
    `https://open-dpp.example/p/${randomUUID()}`,
  );
}

describe("euRegistryExportService", () => {
  const organizationId = randomUUID();
  let passportRepository: { findAllByOrganizationId: jest.Mock<any> };
  let permalinkRepository: { findAllByPassportId: jest.Mock<any> };
  let service: EuRegistryExportService;
  let permalinksByPassport: Map<string, Permalink[]>;

  /** Pages are served newest first, like the repository does. */
  function servePassports(newestFirst: Passport[], pageSize = 100) {
    passportRepository.findAllByOrganizationId.mockImplementation(
      async (_org: any, options: any) => {
        const pagination: Pagination = options.pagination;
        const start = pagination.cursor ? Number(pagination.cursor) : 0;
        const items = newestFirst.slice(start, start + pageSize);
        const next = start + pageSize;
        pagination.setCursor(next < newestFirst.length ? String(next) : null);
        return PagingResult.create({ pagination, items });
      },
    );
  }

  beforeEach(() => {
    permalinksByPassport = new Map();
    passportRepository = { findAllByOrganizationId: jest.fn() };
    permalinkRepository = {
      findAllByPassportId: jest.fn(async (id: any) => permalinksByPassport.get(id) ?? []),
    };
    service = new EuRegistryExportService(
      passportRepository as unknown as PassportRepository,
      permalinkRepository as unknown as PermalinkRepository,
    );
  });

  it("throws NotFoundError when no published passport matches", async () => {
    servePassports([]);
    await expect(service.export(organizationId)).rejects.toThrow(NotFoundError);
  });

  it("queries published passports with template and period filters", async () => {
    servePassports([]);
    const period = Period.fromIso({ start: "2026-01-01T00:00:00.000Z" });
    await service.export(organizationId, { templateIds: ["t1"], period }).catch(() => undefined);

    expect(passportRepository.findAllByOrganizationId).toHaveBeenCalledWith(
      organizationId,
      expect.objectContaining({
        filter: {
          status: [DigitalProductDocumentStatus.Published],
          period,
          templateIds: ["t1"],
        },
      }),
    );
  });

  it("exports the published URLs ordered oldest passport first", async () => {
    const newest = passport();
    const oldest = passport();
    servePassports([newest, oldest]);
    const oldestLink = publishedOpenDpp(oldest.id);
    const newestLink = publishedOpenDpp(newest.id);
    permalinksByPassport.set(oldest.id, [oldestLink]);
    permalinksByPassport.set(newest.id, [newestLink]);

    const result = await service.export(organizationId);

    expect(result.exportedCount).toBe(2);
    expect(result.files.map((f) => f.toPlain())).toEqual([
      {
        schemaVersion: "1.0.0",
        productGroup: "BATTERIES",
        items: [
          { uniqueProductIdentifier: oldestLink.publishedUrl },
          { uniqueProductIdentifier: newestLink.publishedUrl },
        ],
      },
    ]);
  });

  it("uses the GS1 permalink when a passport has one", async () => {
    const p = passport();
    servePassports([p]);
    const openDpp = publishedOpenDpp(p.id, new Date("2026-01-01"));
    const gs1 = Permalink.create({
      passportId: p.id,
      kind: PermalinkKind.GS1_LINK,
      uniqueProductIdentifierId: randomUUID(),
      gs1DataAttributes: gs1DataAttributesPlainFactory.build(),
      createdAt: new Date("2026-02-01"),
    }).withPublishedUrl("https://id.gs1.example/01/123");
    permalinksByPassport.set(p.id, [openDpp, gs1]);

    const result = await service.export(organizationId);

    expect(result.files[0].toPlain().items).toEqual([
      { uniqueProductIdentifier: "https://id.gs1.example/01/123" },
    ]);
  });

  it("fails the whole export and lists passports without a published permalink", async () => {
    const ok = passport();
    const noPermalink = passport();
    const unpublished = passport();
    servePassports([ok, noPermalink, unpublished]);
    permalinksByPassport.set(ok.id, [publishedOpenDpp(ok.id)]);
    permalinksByPassport.set(unpublished.id, [Permalink.create({ passportId: unpublished.id })]);

    const error = await service.export(organizationId).catch((e) => e);

    expect(error).toBeInstanceOf(ValueError);
    expect(error.message).toContain(noPermalink.id);
    expect(error.message).toContain(unpublished.id);
    expect(error.message).not.toContain(ok.id);
  });

  it("reads all pages and splits into files of 100 items", async () => {
    const passports = Array.from({ length: 101 }, () => passport());
    servePassports(passports, 40);
    for (const p of passports) {
      permalinksByPassport.set(p.id, [publishedOpenDpp(p.id)]);
    }

    const result = await service.export(organizationId);

    expect(result.exportedCount).toBe(101);
    expect(result.files.map((f) => f.items.length)).toEqual([100, 1]);
    // oldest first = reverse of the newest-first pages
    const oldestUrl = permalinksByPassport.get(passports[100].id)![0].publishedUrl;
    expect(result.files[0].items[0].uniqueProductIdentifier).toBe(oldestUrl);
  });
});
