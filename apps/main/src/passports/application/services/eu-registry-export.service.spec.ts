import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { PermalinkKind } from "@open-dpp/dto";
import { NotFoundError } from "@open-dpp/exception";
import { gs1DataAttributesPlainFactory, passportsPlainFactory } from "@open-dpp/testing";
import { DigitalProductDocumentStatus } from "../../../digital-product-document/domain/digital-product-document-status";
import { Pagination } from "../../../pagination/pagination";
import { PagingResult } from "../../../pagination/paging-result";
import { Permalink } from "../../../permalink/domain/permalink";
import { PermalinkRepository } from "../../../permalink/infrastructure/permalink.repository";
import { Period } from "../../../time/period";
import type { Archiver } from "archiver";
import type { Response } from "express";
import { Passport } from "../../domain/passport";
import { RegistryExportFile } from "../../domain/registry-export-file";
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

  async function run(filter: any = {}) {
    const files: RegistryExportFile[] = [];
    const result = await service.export(organizationId, filter, (file) => {
      files.push(file);
    });
    return { ...result, files };
  }

  it("throws NotFoundError without calling onFile when no published passport matches", async () => {
    servePassports([]);
    const onFile = jest.fn<(file: RegistryExportFile) => void | Promise<void>>();
    await expect(service.export(organizationId, {}, onFile)).rejects.toThrow(NotFoundError);
    expect(onFile).not.toHaveBeenCalled();
  });

  it("queries published passports with template and period filters", async () => {
    servePassports([]);
    const period = Period.fromIso({ start: "2026-01-01T00:00:00.000Z" });
    await run({ templateIds: ["t1"], period }).catch(() => undefined);

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

  it("exports the published URLs newest passport first", async () => {
    const newest = passport();
    const oldest = passport();
    servePassports([newest, oldest]);
    const newestLink = publishedOpenDpp(newest.id);
    const oldestLink = publishedOpenDpp(oldest.id);
    permalinksByPassport.set(newest.id, [newestLink]);
    permalinksByPassport.set(oldest.id, [oldestLink]);

    const result = await run();

    expect(result.exportedCount).toBe(2);
    expect(result.failedPassportIds).toEqual([]);
    expect(result.files.map((f) => f.toPlain())).toEqual([
      {
        schemaVersion: "1.0.0",
        productGroup: "BATTERIES",
        items: [
          { uniqueProductIdentifier: newestLink.publishedUrl },
          { uniqueProductIdentifier: oldestLink.publishedUrl },
        ],
      },
    ]);
  });

  it("uses the oldest permalink of a passport with several", async () => {
    const p = passport();
    servePassports([p]);
    const oldest = publishedOpenDpp(p.id, new Date("2026-01-01"));
    const gs1 = Permalink.create({
      passportId: p.id,
      kind: PermalinkKind.GS1_LINK,
      uniqueProductIdentifierId: randomUUID(),
      gs1DataAttributes: gs1DataAttributesPlainFactory.build(),
      createdAt: new Date("2026-02-01"),
    }).withPublishedUrl("https://id.gs1.example/01/123");
    permalinksByPassport.set(p.id, [gs1, oldest]);

    const result = await run();

    expect(result.files[0].toPlain().items).toEqual([
      { uniqueProductIdentifier: oldest.publishedUrl },
    ]);
  });

  it("does not fail but reports passports without a published permalink", async () => {
    const ok = passport();
    const noPermalink = passport();
    const unpublished = passport();
    servePassports([ok, noPermalink, unpublished]);
    permalinksByPassport.set(ok.id, [publishedOpenDpp(ok.id)]);
    permalinksByPassport.set(unpublished.id, [Permalink.create({ passportId: unpublished.id })]);

    const result = await run();

    expect(result.exportedCount).toBe(1);
    expect(result.files.flatMap((f) => [...f.items])).toHaveLength(1);
    expect(result.failedPassportIds).toEqual([noPermalink.id, unpublished.id]);
  });

  it("returns only failed passports when none can be exported", async () => {
    const p = passport();
    servePassports([p]);

    const result = await run();

    expect(result.files).toEqual([]);
    expect(result.exportedCount).toBe(0);
    expect(result.failedPassportIds).toEqual([p.id]);
  });

  it("reads all pages, emits full files while reading, and keeps the rest for the end", async () => {
    const passports = Array.from({ length: 101 }, () => passport());
    servePassports(passports, 40);
    for (const p of passports) {
      permalinksByPassport.set(p.id, [publishedOpenDpp(p.id)]);
    }
    const emittedAtPage: number[] = [];
    const files: RegistryExportFile[] = [];

    const result = await service.export(organizationId, {}, (file) => {
      emittedAtPage.push(passportRepository.findAllByOrganizationId.mock.calls.length);
      files.push(file);
    });

    expect(result.exportedCount).toBe(101);
    expect(files.map((f) => f.items.length)).toEqual([100, 1]);
    // the first full file is emitted after the 3rd page (page size is 40), the remainder after the last one
    expect(emittedAtPage).toEqual([3, 3]);
    expect(files[0].items[0].uniqueProductIdentifier).toBe(
      permalinksByPassport.get(passports[0].id)![0].publishedUrl,
    );
  });

  describe("exportToArchive", () => {
    let res: { set: jest.Mock<any>; destroy: jest.Mock<any> };
    let archive: {
      pipe: jest.Mock<any>;
      append: jest.Mock<any>;
      finalize: any;
      abort: jest.Mock<any>;
    };

    beforeEach(() => {
      res = { set: jest.fn(), destroy: jest.fn() };
      archive = {
        pipe: jest.fn(),
        append: jest.fn(),
        finalize: jest.fn(async () => undefined),
        abort: jest.fn(),
      };
    });

    const exportToArchive = () =>
      service.exportToArchive(
        res as unknown as Response,
        organizationId,
        {},
        archive as unknown as Archiver,
        new Date("2026-10-08T10:00:00.000Z"),
      );

    it("streams numbered registry files and sets the headers", async () => {
      const passports = Array.from({ length: 101 }, () => passport());
      servePassports(passports);
      for (const p of passports) {
        permalinksByPassport.set(p.id, [publishedOpenDpp(p.id)]);
      }

      await exportToArchive();

      expect(res.set).toHaveBeenCalledWith({
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="eu-registry-export-2026-10-08.zip"',
      });
      expect(archive.pipe).toHaveBeenCalledWith(res);
      expect(archive.append.mock.calls.map((call) => (call[1] as any).name)).toEqual([
        "batteries-001.json",
        "batteries-002.json",
      ]);
      expect(JSON.parse(archive.append.mock.calls[1][0] as string).items).toHaveLength(1);
      expect(archive.finalize).toHaveBeenCalledTimes(1);
    });

    it("adds failed-passports.json when passports could not be exported", async () => {
      const ok = passport();
      const failed = passport();
      servePassports([ok, failed]);
      permalinksByPassport.set(ok.id, [publishedOpenDpp(ok.id)]);

      await exportToArchive();

      const names = archive.append.mock.calls.map((call) => (call[1] as any).name);
      expect(names).toEqual(["batteries-001.json", "failed-passports.json"]);
      expect(JSON.parse(archive.append.mock.calls[1][0] as string)).toEqual([
        { passportId: failed.id, reason: "No published permalink" },
      ]);
    });

    it("serves only failed-passports.json when nothing could be exported", async () => {
      const failed = passport();
      servePassports([failed]);

      await exportToArchive();

      expect(archive.append.mock.calls.map((call) => (call[1] as any).name)).toEqual([
        "failed-passports.json",
      ]);
      expect(archive.finalize).toHaveBeenCalledTimes(1);
    });

    it("throws before touching the response when no passport matches", async () => {
      servePassports([]);

      await expect(exportToArchive()).rejects.toThrow(NotFoundError);

      expect(res.set).not.toHaveBeenCalled();
      expect(archive.pipe).not.toHaveBeenCalled();
    });

    it("aborts the response when an error happens after streaming started", async () => {
      const p = passport();
      servePassports([p]);
      permalinksByPassport.set(p.id, [publishedOpenDpp(p.id)]);
      archive.finalize.mockImplementation(async () => {
        throw new Error("boom");
      });

      await exportToArchive();

      expect(archive.abort).toHaveBeenCalled();
      expect(res.destroy).toHaveBeenCalled();
    });
  });
});
