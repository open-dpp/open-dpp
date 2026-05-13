import { z } from "zod";
import { KeyTypes, KeyTypesEnum } from "../aas/enums/key-types-enum";
import { DateTimeSchema } from "../shared/digital-product-document.schemas";

export const PresentationReferenceType = {
  Template: "template",
  Passport: "passport",
} as const;

export const PresentationReferenceTypeEnum = z.enum(PresentationReferenceType);
export type PresentationReferenceTypeType = z.infer<typeof PresentationReferenceTypeEnum>;

export const PresentationComponentName = {
  BigNumber: "BigNumber",
} as const;

export const PresentationComponentNameEnum = z.enum(PresentationComponentName);
export type PresentationComponentNameType = z.infer<typeof PresentationComponentNameEnum>;

const KEY_TYPES_SET: ReadonlySet<string> = new Set(Object.values(KeyTypes));

// Silently discards entries whose value is not a currently-registered
// PresentationComponentName (and, when `validKeys` is supplied, entries whose
// key isn't in the allowed set). Used on the READ path — schema parse of
// persisted configs and import bundles — so that rows written against an older
// or extended component enum still load instead of failing the whole parse.
// Intentional drop: the DTO package has no logger; callers that need
// observability should diff sizes before/after parse. The WRITE path uses
// `PresentationConfigurationPatchSchema` which is strict.
function dropUnknownComponents(input: unknown, validKeys?: ReadonlySet<string>): unknown {
  if (input == null || typeof input !== "object") return input;
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (validKeys && !validKeys.has(key)) continue;
    const parsed = PresentationComponentNameEnum.safeParse(value);
    if (parsed.success) {
      cleaned[key] = parsed.data;
    }
  }
  return cleaned;
}

export const PresentationConfigurationDtoSchema = z
  .object({
    id: z.uuid(),
    organizationId: z.string().min(1),
    referenceId: z.uuid(),
    referenceType: PresentationReferenceTypeEnum,
    label: z.string().min(1).nullable().default(null),
    elementDesign: z
      .preprocess(
        (input) => dropUnknownComponents(input),
        z.record(z.string(), PresentationComponentNameEnum),
      )
      .default({}),
    defaultComponents: z
      .preprocess(
        (input) => dropUnknownComponents(input, KEY_TYPES_SET),
        z.partialRecord(KeyTypesEnum, PresentationComponentNameEnum),
      )
      .default({}),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .meta({ id: "PresentationConfiguration" });

export type PresentationConfigurationDto = z.infer<typeof PresentationConfigurationDtoSchema>;

export const PresentationConfigurationInvariantsSchema = z.object({
  organizationId: z.string().min(1),
  referenceId: z.uuid(),
  referenceType: PresentationReferenceTypeEnum,
  label: z.string().min(1).nullable(),
});

export const PresentationConfigurationExportSchema = z.object({
  elementDesign: z
    .preprocess(
      (input) => dropUnknownComponents(input),
      z.record(z.string(), PresentationComponentNameEnum),
    )
    .default({}),
  defaultComponents: z
    .preprocess(
      (input) => dropUnknownComponents(input, KEY_TYPES_SET),
      z.partialRecord(KeyTypesEnum, PresentationComponentNameEnum),
    )
    .default({}),
});

export type PresentationConfigurationExportDto = z.infer<
  typeof PresentationConfigurationExportSchema
>;

export const PresentationConfigurationCreateRequestSchema = z.object({
  label: z.string().min(1).nullable(),
});
export type PresentationConfigurationCreateRequestDto = z.infer<
  typeof PresentationConfigurationCreateRequestSchema
>;

export const PresentationConfigurationListResponseSchema = z.array(
  PresentationConfigurationDtoSchema,
);
export type PresentationConfigurationListResponseDto = z.infer<
  typeof PresentationConfigurationListResponseSchema
>;

export const PresentationConfigurationPatchSchema = z.object({
  elementDesign: z.record(z.string(), PresentationComponentNameEnum.nullable()).optional(),
  defaultComponents: z
    .partialRecord(KeyTypesEnum, PresentationComponentNameEnum.nullable())
    .optional(),
});

export type PresentationConfigurationPatchDto = z.infer<
  typeof PresentationConfigurationPatchSchema
>;
