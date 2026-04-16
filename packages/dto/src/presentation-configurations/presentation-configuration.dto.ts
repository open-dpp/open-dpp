import { z } from "zod";
import { KeyTypesEnum } from "../aas/enums/key-types-enum";
import { DateTimeSchema } from "../shared/dpp.schemas";

export const PresentationReferenceType = {
  Template: "template",
  Passport: "passport",
} as const;

export const PresentationReferenceTypeEnum = z.enum(PresentationReferenceType);
export type PresentationReferenceTypeType = z.infer<typeof PresentationReferenceTypeEnum>;

export const PresentationConfigurationDtoSchema = z
  .object({
    id: z.uuid(),
    organizationId: z.string(),
    referenceId: z.uuid(),
    referenceType: PresentationReferenceTypeEnum,
    elementDesign: z.record(z.string(), z.string()).default({}),
    defaultComponents: z.partialRecord(KeyTypesEnum, z.string()).default({}),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .meta({ id: "PresentationConfiguration" });

export type PresentationConfigurationDto = z.infer<typeof PresentationConfigurationDtoSchema>;

export const PresentationConfigurationExportSchema = z.object({
  elementDesign: z.record(z.string(), z.string()).default({}),
  defaultComponents: z.partialRecord(KeyTypesEnum, z.string()).default({}),
});

export type PresentationConfigurationExportDto = z.infer<
  typeof PresentationConfigurationExportSchema
>;
