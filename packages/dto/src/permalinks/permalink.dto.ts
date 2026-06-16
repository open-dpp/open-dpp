import { z } from "zod";
import { BrandingDtoSchema } from "../branding/branding.dto";
import { Gs1DataAttributesSchema } from "../gs1/gs1-data-attributes.dto";
import { PassportDtoSchema } from "../passports/passport.dto";
import { PresentationConfigurationDtoSchema } from "../presentation-configurations/presentation-configuration.dto";
import { DateTimeSchema } from "../shared/digital-product-document.schemas";
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

/**
 * Discriminator for the two permalink kinds:
 * - PRESENTATION: references a presentation configuration
 * - GS1_LINK: references a UPI (may also reference a presentation configuration)
 */
export const PermalinkKind = {
  PRESENTATION: "presentation",
  GS1_LINK: "gs1-link",
} as const;

export type PermalinkKindType = (typeof PermalinkKind)[keyof typeof PermalinkKind];

export const PermalinkKindSchema = z.enum([PermalinkKind.PRESENTATION, PermalinkKind.GS1_LINK]);

const PermalinkInvariantsPresentationSchema = z
  .object({
    kind: z.literal(PermalinkKind.PRESENTATION),
    presentationConfigurationId: z.uuid(),
    slug: PermalinkSlugSchema.nullish(),
    baseUrl: PermalinkBaseUrlSchema.nullable().optional(),
  })
  .strict();

const PermalinkInvariantsGs1LinkSchema = z.object({
  kind: z.literal(PermalinkKind.GS1_LINK),
  uniqueProductIdentifierId: z.uuid(),
  presentationConfigurationId: z.uuid().nullable(),
  gs1ResolverBase: PermalinkBaseUrlSchema.nullable().optional(),
  gs1DataAttributes: Gs1DataAttributesSchema.nullable().optional(),
  slug: PermalinkSlugSchema.nullish(),
  baseUrl: PermalinkBaseUrlSchema.nullable().optional(),
});

export const PermalinkInvariantsSchema = z.discriminatedUnion("kind", [
  PermalinkInvariantsPresentationSchema,
  PermalinkInvariantsGs1LinkSchema,
]);

/**
 * PermalinkDtoSchema — single ZodObject (required for .extend() in PermalinkPublicDtoSchema).
 *
 * Cross-field invariants are enforced via .check():
 *   - "gs1-link" kind requires a non-null uniqueProductIdentifierId
 *   - "presentation" kind forbids non-null uniqueProductIdentifierId, gs1ResolverBase, gs1DataAttributes
 *   - unknown kind is rejected
 */
export const PermalinkDtoSchema = z
  .object({
    id: z.uuid(),
    kind: PermalinkKindSchema.default(PermalinkKind.PRESENTATION),
    slug: PermalinkSlugSchema.nullable(),
    baseUrl: PermalinkBaseUrlSchema.nullish(),
    publishedUrl: PermalinkPublishedUrlSchema.nullish(),
    presentationConfigurationId: z.uuid().nullable(),
    uniqueProductIdentifierId: z.uuid().nullable().default(null),
    primary: z.boolean().default(false),
    gs1ResolverBase: PermalinkBaseUrlSchema.nullable().default(null),
    gs1DataAttributes: Gs1DataAttributesSchema.nullable().default(null),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .check((ctx) => {
    const { kind, uniqueProductIdentifierId, gs1ResolverBase, gs1DataAttributes } = ctx.value;

    if (kind === PermalinkKind.GS1_LINK) {
      if (uniqueProductIdentifierId === null || uniqueProductIdentifierId === undefined) {
        ctx.issues.push({
          code: "custom",
          input: ctx.value,
          message: 'A gs1-link permalink requires a non-null "uniqueProductIdentifierId"',
          path: ["uniqueProductIdentifierId"],
        });
      }
    } else if (kind === PermalinkKind.PRESENTATION) {
      if (uniqueProductIdentifierId !== null && uniqueProductIdentifierId !== undefined) {
        ctx.issues.push({
          code: "custom",
          input: ctx.value,
          message: 'A presentation permalink must have "uniqueProductIdentifierId" = null',
          path: ["uniqueProductIdentifierId"],
        });
      }
      if (gs1ResolverBase !== null && gs1ResolverBase !== undefined) {
        ctx.issues.push({
          code: "custom",
          input: ctx.value,
          message: 'A presentation permalink must have "gs1ResolverBase" = null',
          path: ["gs1ResolverBase"],
        });
      }
      if (gs1DataAttributes !== null && gs1DataAttributes !== undefined) {
        ctx.issues.push({
          code: "custom",
          input: ctx.value,
          message: 'A presentation permalink must have "gs1DataAttributes" = null',
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

/**
 * The cursor-paginated envelope returned by the org-scoped `GET /permalinks`
 * backoffice list. Mirrors `PassportPaginationDtoSchema`. The public `/p`
 * resolver endpoints continue to return the bare `PermalinkListDtoSchema`.
 */
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

const PermalinkCreatePresentationSchema = z
  .object({
    kind: z.literal(PermalinkKind.PRESENTATION),
    presentationConfigurationId: z.uuid(),
    slug: PermalinkSlugSchema.nullish(),
    baseUrl: PermalinkBaseUrlSchema.nullable().optional(),
  })
  .strict();

const PermalinkCreateGs1LinkSchema = z.object({
  kind: z.literal(PermalinkKind.GS1_LINK),
  uniqueProductIdentifierId: z.uuid(),
  presentationConfigurationId: z.uuid().nullable().optional(),
  gs1ResolverBase: PermalinkBaseUrlSchema.nullable().optional(),
  gs1DataAttributes: Gs1DataAttributesSchema.nullable().optional(),
  slug: PermalinkSlugSchema.nullish(),
  baseUrl: PermalinkBaseUrlSchema.nullable().optional(),
});

export const PermalinkCreateRequestSchema = z
  .discriminatedUnion("kind", [PermalinkCreatePresentationSchema, PermalinkCreateGs1LinkSchema])
  .meta({ id: "PermalinkCreateRequest" });

export type PermalinkCreateRequest = z.infer<typeof PermalinkCreateRequestSchema>;

export const PermalinkUpdateRequestSchema = z
  .object({
    slug: PermalinkSlugSchema.nullish(),
    baseUrl: PermalinkBaseUrlSchema.nullish(),
    primary: z.boolean().optional(),
    gs1ResolverBase: PermalinkBaseUrlSchema.nullish(),
    gs1DataAttributes: Gs1DataAttributesSchema.nullish(),
    presentationConfigurationId: z.uuid().nullish(),
  })
  .meta({ id: "PermalinkUpdateRequest" });

export type PermalinkUpdateRequest = z.infer<typeof PermalinkUpdateRequestSchema>;

export const PassportPermalinkBundleDtoSchema = z
  .object({
    passport: PassportDtoSchema,
    branding: BrandingDtoSchema,
    presentationConfiguration: PresentationConfigurationDtoSchema,
    publicUrl: z.string().url(),
  })
  .meta({ id: "PassportPermalinkBundle" });

export type PassportPermalinkBundleDto = z.infer<typeof PassportPermalinkBundleDtoSchema>;
