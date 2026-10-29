import { describe, expect, it } from "@jest/globals";
import {
  CARRIER_EXPORT_DEFAULTS,
  CARRIER_EXPORT_LIMITS,
  CarrierErrorCorrectionLevel,
  CarrierExportFormat,
  CarrierExportQuerySchema,
} from "./carrier-export.dto";

describe("CarrierExportQuerySchema", () => {
  it("falls back to the defaults for an empty query", () => {
    expect(CarrierExportQuerySchema.parse({})).toEqual({
      format: CarrierExportFormat.SVG,
      moduleSize: 0.495,
      dpi: 300,
      errorCorrection: CarrierErrorCorrectionLevel.M,
    });
    expect(CarrierExportQuerySchema.parse({})).toEqual(CARRIER_EXPORT_DEFAULTS);
  });

  it("coerces query-string numbers", () => {
    expect(
      CarrierExportQuerySchema.parse({
        format: "png",
        moduleSize: "0.99",
        dpi: "600",
        errorCorrection: "H",
      }),
    ).toEqual({ format: "png", moduleSize: 0.99, dpi: 600, errorCorrection: "H" });
  });

  it("accepts the bounds themselves", () => {
    const { moduleSize, dpi } = CARRIER_EXPORT_LIMITS;
    expect(
      CarrierExportQuerySchema.safeParse({ moduleSize: moduleSize.min, dpi: dpi.min }).success,
    ).toBe(true);
    expect(
      CarrierExportQuerySchema.safeParse({ moduleSize: moduleSize.max, dpi: dpi.max }).success,
    ).toBe(true);
  });

  it.each([
    ["an unknown format", { format: "pdf" }],
    ["a module size below the minimum", { moduleSize: "0.25" }],
    ["a module size above the maximum", { moduleSize: "3.51" }],
    ["a module size that is not a number", { moduleSize: "big" }],
    ["a DPI below the minimum", { dpi: "95" }],
    ["a DPI above the maximum", { dpi: "1201" }],
    ["a fractional DPI", { dpi: "300.5" }],
    ["an unknown error-correction level", { errorCorrection: "X" }],
    ["a lower-case error-correction level", { errorCorrection: "m" }],
  ])("rejects %s", (_label, query) => {
    expect(CarrierExportQuerySchema.safeParse(query).success).toBe(false);
  });
});
