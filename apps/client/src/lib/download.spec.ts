import { describe, expect, it } from "vitest";
import { fileNameFromContentDisposition } from "./download.ts";

describe("fileNameFromContentDisposition", () => {
  it.each([
    ['attachment; filename="data-carrier-my-product.png"', "data-carrier-my-product.png"],
    ["attachment; filename=data-carrier-my-product.svg", "data-carrier-my-product.svg"],
    ['inline; FILENAME="report.csv"', "report.csv"],
  ])("reads the file name from %s", (header, expected) => {
    expect(fileNameFromContentDisposition(header)).toBe(expected);
  });

  it.each([
    ["a missing header", undefined],
    ["a header without a file name", "attachment"],
    ["an empty file name", 'attachment; filename=""'],
  ])("returns undefined for %s", (_label, header) => {
    expect(fileNameFromContentDisposition(header)).toBeUndefined();
  });
});
