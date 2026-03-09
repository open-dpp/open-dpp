import { z } from "zod";

export const UniqueProductIdentifierDtoSchema = z.object({
  uuid: z.string(),
  referenceId: z.uuid(),
});

export const UniqueProductIdentifierListDtoSchema = z.array(UniqueProductIdentifierDtoSchema);

export const UniqueProductIdentifierMetadataDtoSchema = z.object({
  passportId: z.uuid(),
  organizationId: z.string(),
  templateId: z.uuid().nullish(),
});
