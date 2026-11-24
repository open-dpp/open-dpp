import { describe, expect, it } from "vitest";
import { formatFileSize } from "./file-size";

describe("formatFileSize", () => {
  it("shows a size below 1 KB in bytes", () => {
    expect(formatFileSize(209, "en")).toBe("209 B");
  });

  it("shows an empty file as 0 B", () => {
    expect(formatFileSize(0, "en")).toBe("0 B");
  });

  it("never shows 0 for a file that is not empty", () => {
    expect(formatFileSize(1, "en")).toBe("1 B");
  });

  it("shows a size from 1 KB on in the unit that fits it, with one decimal", () => {
    expect(formatFileSize(6372, "en")).toBe("6.2 KB");
    expect(formatFileSize(34_000, "en")).toBe("33.2 KB");
    expect(formatFileSize(516_566, "en")).toBe("504.5 KB");
    expect(formatFileSize(1_572_864, "en")).toBe("1.5 MB");
    expect(formatFileSize(1_610_612_736, "en")).toBe("1.5 GB");
  });

  it("moves to the next unit at exactly 1024 and drops a decimal of 0", () => {
    expect(formatFileSize(1023, "en")).toBe("1023 B");
    expect(formatFileSize(1024, "en")).toBe("1 KB");
    expect(formatFileSize(1_048_576, "en")).toBe("1 MB");
    expect(formatFileSize(15_728_640, "en")).toBe("15 MB");
  });

  it("moves a value that rounds up to 1024 to the next unit", () => {
    expect(formatFileSize(1_048_575, "en")).toBe("1 MB");
    expect(formatFileSize(1_073_741_823, "en")).toBe("1 GB");
  });

  it("stays in GB, the largest unit, from 1024 GB on", () => {
    expect(formatFileSize(2_199_023_255_552, "en")).toBe("2048 GB");
  });

  it("uses the decimal separator of the language", () => {
    expect(formatFileSize(34_000, "de")).toBe("33,2 KB");
    expect(formatFileSize(34_000, "de-DE")).toBe("33,2 KB");
    expect(formatFileSize(34_000, "en-US")).toBe("33.2 KB");
  });
});
