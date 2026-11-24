import { Buffer } from "node:buffer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Logger } from "@nestjs/common";
import { fileTypeFromBuffer } from "./file-type-util";

// `vi.mock` is hoisted above the imports, so its factory may only use what `vi.hoisted` declares.
const { mockLoadEsm } = vi.hoisted(() => ({ mockLoadEsm: vi.fn<any>() }));

vi.mock("load-esm", () => ({ loadEsm: mockLoadEsm }));

describe("fileTypeFromBuffer", () => {
  const buffer = Buffer.from("content");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the type that file-type detects", async () => {
    const detected = { ext: "png", mime: "image/png" };
    const detect = vi.fn<any>(async () => detected);
    mockLoadEsm.mockResolvedValue({ fileTypeFromBuffer: detect });

    await expect(fileTypeFromBuffer(buffer)).resolves.toEqual(detected);
    expect(mockLoadEsm).toHaveBeenCalledWith("file-type");
    expect(detect).toHaveBeenCalledWith(buffer);
  });

  it("logs a failed import of file-type through the Logger and detects nothing", async () => {
    const errorSpy = vi.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const importError = new Error("Cannot find package 'file-type'");
    mockLoadEsm.mockRejectedValue(importError);

    await expect(fileTypeFromBuffer(buffer)).resolves.toBeNull();

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("file-type"), importError);
    expect(consoleSpy).not.toHaveBeenCalled();
  });
});
