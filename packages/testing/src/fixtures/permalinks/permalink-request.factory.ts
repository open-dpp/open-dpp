import type { Gs1DataAttributes, PermalinkUpdateRequest } from "@open-dpp/dto";
import { randomUUID } from "node:crypto";
import { Factory } from "fishery";
import { gs1DataAttributesPlainFactory } from "../gs1/gs1-data-attributes.factory";

// ---------------------------------------------------------------------------
// Presentation create request factory
// ---------------------------------------------------------------------------

interface PresentationCreateRequestRaw {
  kind: "presentation";
  presentationConfigurationId: string;
  slug?: string | null;
  baseUrl?: string | null;
}

/**
 * Fishery factory for a raw PermalinkCreateRequest (presentation variant).
 *
 * Default output: { kind: 'presentation', presentationConfigurationId: <uuid> }
 * Parses against PermalinkCreateRequestSchema (presentation branch).
 */
export const permalinkCreateRequestPlainFactory = Factory.define<PresentationCreateRequestRaw>(
  ({ params }) => {
    const presentationConfigurationId =
      params.presentationConfigurationId !== undefined
        ? params.presentationConfigurationId
        : randomUUID();

    return {
      kind: "presentation" as const,
      presentationConfigurationId,
    };
  },
);

// ---------------------------------------------------------------------------
// GS1-link create request factory
// ---------------------------------------------------------------------------

/**
 * The raw (pre-parse) shape of a gs1-link create request.
 * The PermalinkCreateRequestSchema gs1-link branch requires uniqueProductIdentifierId
 * and allows optional presentationConfigurationId, gs1ResolverBase, gs1DataAttributes, slug, baseUrl.
 */
interface Gs1LinkCreateRequestRaw {
  kind: "gs1-link";
  uniqueProductIdentifierId: string;
  presentationConfigurationId?: string | null;
  gs1ResolverBase?: string | null;
  gs1DataAttributes?: Gs1DataAttributes | null;
  slug?: string | null;
  baseUrl?: string | null;
}

/**
 * Fishery factory for a raw PermalinkCreateRequest (gs1-link variant).
 *
 * Default output: {
 *   kind: 'gs1-link',
 *   uniqueProductIdentifierId: <uuid>,
 *   gs1DataAttributes: { "17": "251231" },   ← from gs1DataAttributesPlainFactory
 *   gs1ResolverBase: 'https://id.gs1.org',
 * }
 * Parses against PermalinkCreateRequestSchema (gs1-link branch).
 */
export const permalinkGs1LinkCreateRequestPlainFactory = Factory.define<Gs1LinkCreateRequestRaw>(
  ({ params }) => {
    const uniqueProductIdentifierId =
      params.uniqueProductIdentifierId !== undefined
        ? params.uniqueProductIdentifierId
        : randomUUID();

    const gs1DataAttributes: Gs1DataAttributes | null =
      params.gs1DataAttributes !== undefined
        ? (params.gs1DataAttributes as Gs1DataAttributes | null)
        : gs1DataAttributesPlainFactory.build();

    const gs1ResolverBase =
      params.gs1ResolverBase !== undefined
        ? params.gs1ResolverBase
        : "https://id.gs1.org";

    const result: Gs1LinkCreateRequestRaw = {
      kind: "gs1-link" as const,
      uniqueProductIdentifierId,
      gs1DataAttributes,
      gs1ResolverBase,
    };

    if (params.presentationConfigurationId !== undefined) {
      result.presentationConfigurationId = params.presentationConfigurationId;
    }

    if (params.slug !== undefined) {
      result.slug = params.slug;
    }

    if (params.baseUrl !== undefined) {
      result.baseUrl = params.baseUrl;
    }

    return result;
  },
);

// ---------------------------------------------------------------------------
// Update request factory
// ---------------------------------------------------------------------------

/**
 * The raw shape of a PermalinkUpdateRequest.
 * No 'kind' field — kind is immutable after create.
 */
type PermalinkUpdateRequestRaw = Omit<PermalinkUpdateRequest, never>;

/**
 * Fishery factory for a raw PermalinkUpdateRequest.
 *
 * Default output: {} (an empty update — all fields optional, all absent).
 * Parses against PermalinkUpdateRequestSchema.
 */
export const permalinkUpdateRequestPlainFactory = Factory.define<PermalinkUpdateRequestRaw>(
  ({ params }) => {
    const result: PermalinkUpdateRequestRaw = {};

    if (params.slug !== undefined) {
      result.slug = params.slug;
    }

    if (params.baseUrl !== undefined) {
      result.baseUrl = params.baseUrl;
    }

    if (params.primary !== undefined) {
      result.primary = params.primary;
    }

    if (params.gs1ResolverBase !== undefined) {
      result.gs1ResolverBase = params.gs1ResolverBase;
    }

    if (params.gs1DataAttributes !== undefined) {
      result.gs1DataAttributes = params.gs1DataAttributes as Gs1DataAttributes | null | undefined;
    }

    if (params.presentationConfigurationId !== undefined) {
      result.presentationConfigurationId = params.presentationConfigurationId;
    }

    return result;
  },
);
