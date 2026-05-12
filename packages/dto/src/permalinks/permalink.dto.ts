import { z } from "zod";
import { BrandingDtoSchema } from "../branding/branding.dto";
import { PassportDtoSchema } from "../passports/passport.dto";
import { PresentationConfigurationDtoSchema } from "../presentation-configurations/presentation-configuration.dto";
import { DateTimeSchema } from "../shared/digital-product-document.schemas";
import { PermalinkBaseUrlSchema } from "../shared/permalink-base-url.schema";

// Slugs that would collide with literal path segments under the public `/p`
// namespace. Whenever a new literal child route is added to PRESENTATION_PARENT
// in apps/client/src/router/routes/presentation/presentation.ts, add it here.
// A frontend unit test asserts the two stay in sync — see the router spec.
//
// Note: numeric-only slugs (e.g. "404") are already rejected by a separate
// refine, so they don't need to appear here.
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

export const PermalinkInvariantsSchema = z.object({
  presentationConfigurationId: z.uuid(),
  slug: PermalinkSlugSchema.nullable(),
  baseUrl: PermalinkBaseUrlSchema.nullable().optional(),
});

export const PermalinkDtoSchema = z
  .object({
    id: z.uuid(),
    slug: PermalinkSlugSchema.nullable(),
    // Per-permalink override of the org-level white-label base URL. `null`
    // means "fall back to the org default / instance env". `nullish()` (vs
    // `nullable()`) accepts a missing key so legacy DB documents written
    // before this field existed still rehydrate cleanly.
    baseUrl: PermalinkBaseUrlSchema.nullish(),
    presentationConfigurationId: z.uuid(),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .meta({ id: "Permalink" });

export type PermalinkDto = z.infer<typeof PermalinkDtoSchema>;

// Source of the resolved `fallbackBaseUrl` — exposes which link of the chain
// the client should attribute the base URL to when rendering a preview.
export const PermalinkFallbackBaseUrlSourceSchema = z.enum(["branding", "instance"]);
export type PermalinkFallbackBaseUrlSource = z.infer<typeof PermalinkFallbackBaseUrlSourceSchema>;

// Wire shape for permalink list responses. Adds the server-resolved public URL
// (`permalink.baseUrl ?? branding.permalinkBaseUrl ?? OPEN_DPP_URL`) so clients
// don't reimplement the fallback chain when rendering QR codes / share links.
// `fallbackBaseUrl` exposes the URL that would resolve if `permalink.baseUrl`
// were cleared — the post-override link of the chain — so the settings dialog
// can preview a base-URL clear without losing the fallback chain. Paired with
// `fallbackBaseUrlSource` so the client can label the source (org branding vs
// instance default) without re-deriving the chain.
export const PermalinkPublicDtoSchema = PermalinkDtoSchema.extend({
  publicUrl: z.string().url(),
  fallbackBaseUrl: PermalinkBaseUrlSchema,
  fallbackBaseUrlSource: PermalinkFallbackBaseUrlSourceSchema,
}).meta({ id: "PermalinkPublic" });

export type PermalinkPublicDto = z.infer<typeof PermalinkPublicDtoSchema>;

export const PermalinkListDtoSchema = z.array(PermalinkPublicDtoSchema);
export type PermalinkListDto = z.infer<typeof PermalinkListDtoSchema>;

export const PermalinkMetadataDtoSchema = z.object({
  passportId: z.uuid(),
  organizationId: z.string().min(1),
  templateId: z.uuid().nullish(),
});

export type PermalinkMetadataDto = z.infer<typeof PermalinkMetadataDtoSchema>;

// Request body for PATCH /p/:id. `undefined` (key absent) leaves a field
// untouched; `null` clears it; a value sets it. Both fields are independent
// so callers can update one without touching the other.
export const PermalinkUpdateRequestSchema = z
  .object({
    slug: PermalinkSlugSchema.nullish(),
    baseUrl: PermalinkBaseUrlSchema.nullish(),
  })
  .meta({ id: "PermalinkUpdateRequest" });

export type PermalinkUpdateRequest = z.infer<typeof PermalinkUpdateRequestSchema>;

// Unified response for `GET /p/:id` returning everything a public viewer needs
// in a single round-trip: passport DTO, branding, the (filtered) effective
// presentation configuration, and the resolved public URL the QR / share link
// should point to. The server resolves `permalink.baseUrl ?? branding.permalinkBaseUrl
// ?? OPEN_DPP_URL` and ships the final string so clients don't duplicate the
// fallback chain.
export const PassportPermalinkBundleDtoSchema = z
  .object({
    passport: PassportDtoSchema,
    branding: BrandingDtoSchema,
    presentationConfiguration: PresentationConfigurationDtoSchema,
    publicUrl: z.string().url(),
  })
  .meta({ id: "PassportPermalinkBundle" });

export type PassportPermalinkBundleDto = z.infer<typeof PassportPermalinkBundleDtoSchema>;
