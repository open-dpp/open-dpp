import { type Mock, beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "@open-dpp/exception";
import type { Archiver } from "archiver";
import type { Response } from "express";
import { EuRegistryExportResult } from "../application/services/eu-registry-export.service";
import { EuRegistryProductGroup, RegistryExportFile } from "../domain/registry-export-file";
import { RegistryExportItem } from "../domain/registry-export-item";
import { writeRegistryExportZip } from "./registry-export-zip.writer";

function file(itemCount = 1): RegistryExportFile {
  const items = Array.from({ length: itemCount }, (_, i) =>
    RegistryExportItem.create({ uniqueProductIdentifier: `https://open-dpp.example/p/${i}` }),
  );
  return RegistryExportFile.fromExportItems(EuRegistryProductGroup.Batteries, items)[0];
}

async function* generate(
  files: RegistryExportFile[],
  failedPassportIds: string[] = [],
  error?: Error,
): AsyncGenerator<RegistryExportFile, EuRegistryExportResult> {
  for (const f of files) {
    yield f;
  }
  if (error) throw error;
  return { exportedCount: files.length, failedPassportIds };
}

describe("writeRegistryExportZip", () => {
  let res: { set: Mock<any>; destroy: Mock<any> };
  let archive: {
    on: Mock<any>;
    pipe: Mock<any>;
    append: Mock<any>;
    finalize: any;
    abort: Mock<any>;
  };

  beforeEach(() => {
    res = { set: vi.fn(), destroy: vi.fn() };
    archive = {
      pipe: vi.fn(),
      append: vi.fn(),
      finalize: vi.fn(async () => undefined),
      abort: vi.fn(),
      on: vi.fn(),
    };
  });

  const write = (files: ReturnType<typeof generate>) =>
    writeRegistryExportZip(res as unknown as Response, files, {
      archive: archive as unknown as Archiver,
      now: new Date("2026-10-08T10:00:00.000Z"),
    });

  const names = () => archive.append.mock.calls.map((call) => (call[1] as any).name);

  it("streams numbered registry files and sets the headers", async () => {
    await write(generate([file(), file(2)]));

    expect(res.set).toHaveBeenCalledWith({
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="eu-registry-export-2026-10-08.zip"',
    });
    expect(archive.pipe).toHaveBeenCalledWith(res);
    expect(names()).toEqual(["batteries-001.json", "batteries-002.json"]);
    expect(JSON.parse(archive.append.mock.calls[1][0] as string).items).toHaveLength(2);
    expect(archive.finalize).toHaveBeenCalledTimes(1);
  });

  it("adds failed-passports.json when passports could not be exported", async () => {
    await write(generate([file()], ["p1"]));

    expect(names()).toEqual(["batteries-001.json", "failed-passports.json"]);
    expect(JSON.parse(archive.append.mock.calls[1][0] as string)).toEqual([
      { passportId: "p1", reason: "No published permalink" },
    ]);
  });

  it("serves only failed-passports.json when nothing could be exported", async () => {
    await write(generate([], ["p1"]));

    expect(names()).toEqual(["failed-passports.json"]);
    expect(archive.finalize).toHaveBeenCalledTimes(1);
  });

  it("throws before touching the response when the export fails up front", async () => {
    await expect(write(generate([], [], new NotFoundError("none")))).rejects.toThrow(NotFoundError);

    expect(res.set).not.toHaveBeenCalled();
    expect(archive.pipe).not.toHaveBeenCalled();
  });

  it("aborts the response when the export fails after streaming started", async () => {
    await write(generate([file()], [], new Error("boom")));

    expect(archive.abort).toHaveBeenCalled();
    expect(res.destroy).toHaveBeenCalled();
  });

  it("aborts the response when finalizing fails", async () => {
    archive.finalize.mockImplementation(async () => {
      throw new Error("boom");
    });

    await write(generate([file()]));

    expect(archive.abort).toHaveBeenCalled();
    expect(res.destroy).toHaveBeenCalled();
  });

  it("destroys the response when the archive emits an error event", async () => {
    await write(generate([file()]));

    const [event, listener] = archive.on.mock.calls[0] as [string, (error: Error) => void];
    expect(event).toBe("error");
    // the listener has to be registered before the archive is piped
    expect(archive.on.mock.invocationCallOrder[0]).toBeLessThan(
      archive.pipe.mock.invocationCallOrder[0],
    );
    const error = new Error("archive failed");
    listener(error);
    expect(archive.abort).toHaveBeenCalled();
    expect(res.destroy).toHaveBeenCalledWith(error);
  });
});
