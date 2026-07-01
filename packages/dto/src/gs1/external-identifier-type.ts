import { z } from "zod";

/**
 * Discriminates the kind of external identifier carried by a UniqueProductIdentifier.
 *
 * - `OPEN_DPP_UUID`  — system-generated UPI; no external identity data.
 * - `GS1`            — GS1 identity: GTIN-14 + optional batch/serial.
 * - `GTIN`           — GTIN/EAN read-only system row; not creatable via the API.
 * - `EAN`            — EAN read-only system row; not creatable via the API.
 */
export const ExternalIdentifierType = {
  OPEN_DPP_UUID: "OPEN_DPP_UUID",
  GS1: "GS1",
  GTIN: "GTIN",
  EAN: "EAN",
} as const;

export type ExternalIdentifierTypeValue =
  (typeof ExternalIdentifierType)[keyof typeof ExternalIdentifierType];

export const ExternalIdentifierTypeSchema = z.enum([
  ExternalIdentifierType.OPEN_DPP_UUID,
  ExternalIdentifierType.GS1,
  ExternalIdentifierType.GTIN,
  ExternalIdentifierType.EAN,
]);

/**
 * The GS1 granularity level implied by which key qualifiers are present on a UPI.
 *
 * - `model`  — bare GTIN only (product model)
 * - `batch`  — GTIN + batch/lot (AI `10`)
 * - `item`   — GTIN + serial (AI `21`), optionally also batch
 */
export const Gs1GranularitySchema = z.enum(["model", "batch", "item"]);

export type Gs1Granularity = z.infer<typeof Gs1GranularitySchema>;
