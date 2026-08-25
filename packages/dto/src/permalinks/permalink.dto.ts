import { z } from "zod";
import { BrandingDtoSchema } from "../branding/branding.dto";
import { Gs1DataAttributesSchema } from "../unique-product-identifiers/gs1/gs1-data-attributes.dto";
import { PassportDtoSchema } from "../passports/passport.dto";
import { PresentationConfigurationDtoSchema } from "../presentation-configurations/presentation-configuration.dto";
import { DateTimeSchema } from "../digital-product-document/digital-product-document.schemas";
import { PagingMetadataDtoSchema } from "../shared/pagination.dto";
import { PermalinkBaseUrlSchema } from "../shared/permalink-base-url.schema";

export const PERMALINK_RESERVED_SLUGS: readonly string[] = ["new", "edit"];

const reservedSlugSet = new Set<string>(PERMALINK_RESERVED_SLUGS);

export const PermalinkSlugSchema = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/)
  .refine((slug) => !/^\d+$/.test(slug), { error: "Slug cannot be numeric-only" })
  .refine((slug) => !reservedSlugSet.has(slug), { error: "Slug is reserved" });

export type PermalinkSlug = z.infer<typeof PermalinkSlugSchema>;

export const PermalinkSchema = z.union([z.uuid(), PermalinkSlugSchema]);

export const PermalinkPublishedUrlSchema = z.string().url().max(2048);
export type PermalinkPublishedUrl = z.infer<typeof PermalinkPublishedUrlSchema>;

export const PermalinkKind = {
  OPEN_DPP: "open-dpp",
  GS1_LINK: "gs1-link",
} as const;

export const LEGACY_PERMALINK_KIND = "presentation" as const;

export type PermalinkKindType = (typeof PermalinkKind)[keyof typeof PermalinkKind];

export const PermalinkKindSchema = z.enum([PermalinkKind.OPEN_DPP, PermalinkKind.GS1_LINK]);

const PermalinkInvariantsOpenDppSchema = z
  .object({
    kind: z.literal(PermalinkKind.OPEN_DPP),
    passportId: z.uuid(),
    presentationConfigurationId: z.uuid().nullish(),
    uniqueProductIdentifierId: z.uuid().nullish(),
    slug: PermalinkSlugSchema.nullish(),
    baseUrl: PermalinkBaseUrlSchema.nullable().optional(),
  })
  .strict();

const PermalinkInvariantsGs1LinkSchema = z.object({
  kind: z.literal(PermalinkKind.GS1_LINK),
  passportId: z.uuid(),
  uniqueProductIdentifierId: z.uuid(),
  presentationConfigurationId: z.uuid().nullable(),
  gs1DataAttributes: Gs1DataAttributesSchema.nullable().optional(),
  slug: PermalinkSlugSchema.nullish(),
  baseUrl: PermalinkBaseUrlSchema.nullable().optional(),
});

export const PermalinkInvariantsSchema = z.discriminatedUnion("kind", [
  PermalinkInvariantsOpenDppSchema,
  PermalinkInvariantsGs1LinkSchema,
]);

export const PermalinkDtoSchema = z
  .object({
    id: z.uuid(),
    kind: PermalinkKindSchema.default(PermalinkKind.OPEN_DPP),
    passportId: z.uuid(),
    slug: PermalinkSlugSchema.nullable(),
    baseUrl: PermalinkBaseUrlSchema.nullish(),
    publishedUrl: PermalinkPublishedUrlSchema.nullish(),
    presentationConfigurationId: z.uuid().nullable(),
    uniqueProductIdentifierId: z.uuid().nullable().default(null),
    gs1DataAttributes: Gs1DataAttributesSchema.nullable().default(null),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .check((ctx) => {
    const { kind, uniqueProductIdentifierId, gs1DataAttributes } = ctx.value;

    if (kind === PermalinkKind.GS1_LINK) {
      if (uniqueProductIdentifierId == null) {
        ctx.issues.push({
          code: "custom",
          input: ctx.value,
          message: 'A gs1-link permalink requires a non-null "uniqueProductIdentifierId"',
          path: ["uniqueProductIdentifierId"],
        });
      }
    } else if (kind === PermalinkKind.OPEN_DPP) {
      if (gs1DataAttributes != null) {
        ctx.issues.push({
          code: "custom",
          input: ctx.value,
          message: 'An open-dpp permalink must have "gs1DataAttributes" = null',
          path: ["gs1DataAttributes"],
        });
      }
    }
  })
  .meta({ id: "Permalink" });

export type PermalinkDto = z.infer<typeof PermalinkDtoSchema>;

export const PermalinkFallbackBaseUrlSourceSchema = z.enum(["branding", "instance"]);
export type PermalinkFallbackBaseUrlSource = z.infer<typeof PermalinkFallbackBaseUrlSourceSchema>;

export const PermalinkPublicDtoSchema = PermalinkDtoSchema.extend({
  publicUrl: z.string().url(),
  fallbackBaseUrl: PermalinkBaseUrlSchema,
  fallbackBaseUrlSource: PermalinkFallbackBaseUrlSourceSchema,
}).meta({ id: "PermalinkPublic" });

export type PermalinkPublicDto = z.infer<typeof PermalinkPublicDtoSchema>;

export const PermalinkListDtoSchema = z.array(PermalinkPublicDtoSchema);
export type PermalinkListDto = z.infer<typeof PermalinkListDtoSchema>;

export const PermalinkPaginationDtoSchema = z
  .object({
    ...PagingMetadataDtoSchema.shape,
    result: PermalinkPublicDtoSchema.array(),
  })
  .meta({ id: "Permalinks" });

export type PermalinkPaginationDto = z.infer<typeof PermalinkPaginationDtoSchema>;

export const PermalinkMetadataDtoSchema = z.object({
  passportId: z.uuid(),
  organizationId: z.string().min(1),
  templateId: z.uuid().nullish(),
});

export type PermalinkMetadataDto = z.infer<typeof PermalinkMetadataDtoSchema>;

const PermalinkCreateOpenDppSchema = z
  .object({
    kind: z.literal(PermalinkKind.OPEN_DPP),
    passportId: z.uuid(),
    presentationConfigurationId: z.uuid().nullish(),
    uniqueProductIdentifierId: z.uuid().nullish(),
    slug: PermalinkSlugSchema.nullish(),
    baseUrl: PermalinkBaseUrlSchema.nullable().optional(),
  })
  .strict();

const PermalinkCreateGs1LinkSchema = z.object({
  kind: z.literal(PermalinkKind.GS1_LINK),
  passportId: z.uuid(),
  uniqueProductIdentifierId: z.uuid(),
  presentationConfigurationId: z.uuid().nullable().optional(),
  gs1DataAttributes: Gs1DataAttributesSchema.nullable().optional(),
  slug: PermalinkSlugSchema.nullish(),
  baseUrl: PermalinkBaseUrlSchema.nullable().optional(),
});

export const PermalinkCreateRequestSchema = z
  .discriminatedUnion("kind", [PermalinkCreateOpenDppSchema, PermalinkCreateGs1LinkSchema])
  .meta({ id: "PermalinkCreateRequest" });

export type PermalinkCreateRequest = z.infer<typeof PermalinkCreateRequestSchema>;

export const PermalinkUpdateRequestSchema = z
  .object({
    slug: PermalinkSlugSchema.nullish(),
    baseUrl: PermalinkBaseUrlSchema.nullish(),
    gs1DataAttributes: Gs1DataAttributesSchema.nullish(),
    presentationConfigurationId: z.uuid().nullish(),
  })
  .meta({ id: "PermalinkUpdateRequest" });

export type PermalinkUpdateRequest = z.infer<typeof PermalinkUpdateRequestSchema>;

export const PassportPermalinkBundleDtoSchema = z
  .object({
    passport: PassportDtoSchema,
    branding: BrandingDtoSchema,
    presentationConfiguration: PresentationConfigurationDtoSchema.nullable(),
    publicUrl: z.string().url(),
  })
  .meta({ id: "PassportPermalinkBundle" });

export type PassportPermalinkBundleDto = z.infer<typeof PassportPermalinkBundleDtoSchema>;
