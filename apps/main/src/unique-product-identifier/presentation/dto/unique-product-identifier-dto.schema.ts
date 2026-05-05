import { z } from "zod";

// Discriminator for the external registry / identifier scheme a UPI represents.
// `OPEN_DPP_UUID` is the default for legacy rows that predate the multi-registry
// design and for any UPI created by the platform itself (server-generated UUID
// pointing at an internal Passport). New schemes (GS1, GTIN, EAN, …) can be
// added here as ingestion pipelines for those registries land — note that the
// underlying `value` semantics differ per scheme (UUID for OPEN_DPP_UUID, GS1
// EPC URI for GS1, raw 14-digit code for GTIN, etc.), so callers should not
// mix-and-match without consulting the registry-specific format.
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

export const UniqueProductIdentifierDtoSchema = z.object({
  uuid: z.string(),
  referenceId: z.uuid(),
  // Optional in the DTO (and defaulted on read from the DB) so legacy rows
  // without a `type` field still deserialize cleanly.
  type: ExternalIdentifierTypeSchema.default(ExternalIdentifierType.OPEN_DPP_UUID),
});

export const UniqueProductIdentifierListDtoSchema = z.array(UniqueProductIdentifierDtoSchema);

export const UniqueProductIdentifierMetadataDtoSchema = z.object({
  passportId: z.uuid(),
  organizationId: z.string(),
  templateId: z.uuid().nullish(),
});
