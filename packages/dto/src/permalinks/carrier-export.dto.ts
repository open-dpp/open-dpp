import { z } from "zod";

export const CarrierExportFormat = {
  SVG: "svg",
  PNG: "png",
} as const;

export type CarrierExportFormatType =
  (typeof CarrierExportFormat)[keyof typeof CarrierExportFormat];

export const CarrierExportFormatSchema = z.enum([CarrierExportFormat.SVG, CarrierExportFormat.PNG]);

/** QR Code error-correction levels; they restore about 7 %, 15 %, 25 % and 30 % of the symbol. */
export const CarrierErrorCorrectionLevel = {
  L: "L",
  M: "M",
  Q: "Q",
  H: "H",
} as const;

export type CarrierErrorCorrectionLevelType =
  (typeof CarrierErrorCorrectionLevel)[keyof typeof CarrierErrorCorrectionLevel];

export const CarrierErrorCorrectionLevelSchema = z.enum([
  CarrierErrorCorrectionLevel.L,
  CarrierErrorCorrectionLevel.M,
  CarrierErrorCorrectionLevel.Q,
  CarrierErrorCorrectionLevel.H,
]);

/**
 * Module size (X-dimension) in mm: the smallest and largest QR X-dimension in the GS1 symbol
 * specification tables. DPI: screen resolution up to fine print.
 */
export const CARRIER_EXPORT_LIMITS = {
  moduleSize: { min: 0.254, max: 3.5 },
  dpi: { min: 96, max: 1200 },
} as const;

/** The Packaging preset: phones scanning consumer packaging, GS1 target X of 0.495 mm. */
export const CARRIER_EXPORT_DEFAULTS = {
  format: CarrierExportFormat.SVG,
  moduleSize: 0.495,
  dpi: 300,
  errorCorrection: CarrierErrorCorrectionLevel.M,
} as const;

/** Technical settings of a Carrier Export, read from the query string. */
export const CarrierExportQuerySchema = z.object({
  format: CarrierExportFormatSchema.default(CARRIER_EXPORT_DEFAULTS.format),
  /** Module size (X-dimension) in mm. */
  moduleSize: z.coerce
    .number()
    .min(CARRIER_EXPORT_LIMITS.moduleSize.min)
    .max(CARRIER_EXPORT_LIMITS.moduleSize.max)
    .default(CARRIER_EXPORT_DEFAULTS.moduleSize),
  /** Resolution of a PNG; ignored for SVG. */
  dpi: z.coerce
    .number()
    .int()
    .min(CARRIER_EXPORT_LIMITS.dpi.min)
    .max(CARRIER_EXPORT_LIMITS.dpi.max)
    .default(CARRIER_EXPORT_DEFAULTS.dpi),
  errorCorrection: CarrierErrorCorrectionLevelSchema.default(
    CARRIER_EXPORT_DEFAULTS.errorCorrection,
  ),
});

export type CarrierExportQuery = z.infer<typeof CarrierExportQuerySchema>;

/** The query as a caller sends it: every setting is optional. */
export type CarrierExportQueryParams = z.input<typeof CarrierExportQuerySchema>;
