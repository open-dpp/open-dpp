import { z } from "zod";

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
  type: ExternalIdentifierTypeSchema.default(ExternalIdentifierType.OPEN_DPP_UUID),
});

export const UniqueProductIdentifierListDtoSchema = z.array(UniqueProductIdentifierDtoSchema);

export const UniqueProductIdentifierMetadataDtoSchema = z.object({
  passportId: z.uuid(),
  organizationId: z.string(),
  templateId: z.uuid().nullish(),
});
