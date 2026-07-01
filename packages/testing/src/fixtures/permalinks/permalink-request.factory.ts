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

/** Raw PermalinkCreateRequest (presentation variant); default kind='presentation' with a uuid configId. */
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

/** Raw (pre-parse) shape of a gs1-link create request. */
interface Gs1LinkCreateRequestRaw {
  kind: "gs1-link";
  uniqueProductIdentifierId: string;
  presentationConfigurationId?: string | null;
  gs1DataAttributes?: Gs1DataAttributes | null;
  slug?: string | null;
  baseUrl?: string | null;
}

/** Raw PermalinkCreateRequest (gs1-link variant); default gs1DataAttributes comes from gs1DataAttributesPlainFactory. */
export const permalinkGs1LinkCreateRequestPlainFactory = Factory.define<Gs1LinkCreateRequestRaw>(
  ({ params }) => {
    const uniqueProductIdentifierId =
      params.uniqueProductIdentifierId !== undefined
        ? params.uniqueProductIdentifierId
        : randomUUID();

    // gs1DataAttributes replaces (not merges) the default, so it must be resolved
    // from params here; fishery overlays the remaining optional fields automatically.
    const gs1DataAttributes: Gs1DataAttributes | null =
      params.gs1DataAttributes !== undefined
        ? (params.gs1DataAttributes as Gs1DataAttributes | null)
        : gs1DataAttributesPlainFactory.build();

    return {
      kind: "gs1-link" as const,
      uniqueProductIdentifierId,
      gs1DataAttributes,
    };
  },
);

// ---------------------------------------------------------------------------
// Update request factory
// ---------------------------------------------------------------------------

/** Raw PermalinkUpdateRequest (no 'kind' — immutable after create); default is an empty update. */
export const permalinkUpdateRequestPlainFactory = Factory.define<PermalinkUpdateRequest>(() => ({}));
