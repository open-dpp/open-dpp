import type { Gs1DataAttributes, PermalinkUpdateRequest } from "@open-dpp/dto";
import { randomUUID } from "node:crypto";
import { Factory } from "fishery";
import { gs1DataAttributesPlainFactory } from "../gs1/gs1-data-attributes.factory";

// ---------------------------------------------------------------------------
// Open-dpp create request factory
// ---------------------------------------------------------------------------

interface OpenDppCreateRequestRaw {
  kind: "open-dpp";
  passportId: string;
  presentationConfigurationId?: string | null;
  uniqueProductIdentifierId?: string | null;
  slug?: string | null;
  baseUrl?: string | null;
}

/** Raw PermalinkCreateRequest (open-dpp variant); bare by default — passportId only. */
export const permalinkCreateRequestPlainFactory = Factory.define<OpenDppCreateRequestRaw>(() => ({
  kind: "open-dpp" as const,
  passportId: randomUUID(),
}));

// ---------------------------------------------------------------------------
// GS1-link create request factory
// ---------------------------------------------------------------------------

/** Raw (pre-parse) shape of a gs1-link create request. */
interface Gs1LinkCreateRequestRaw {
  kind: "gs1-link";
  passportId: string;
  uniqueProductIdentifierId: string;
  presentationConfigurationId?: string | null;
  gs1DataAttributes?: Gs1DataAttributes | null;
  slug?: string | null;
  baseUrl?: string | null;
}

/** Raw PermalinkCreateRequest (gs1-link variant); default gs1DataAttributes comes from gs1DataAttributesPlainFactory. */
export const permalinkGs1LinkCreateRequestPlainFactory = Factory.define<Gs1LinkCreateRequestRaw>(
  ({ params }) => {
    // gs1DataAttributes replaces (not merges) the default, so it must be resolved
    // from params here; fishery overlays the remaining optional fields automatically.
    const gs1DataAttributes: Gs1DataAttributes | null =
      params.gs1DataAttributes !== undefined
        ? (params.gs1DataAttributes as Gs1DataAttributes | null)
        : gs1DataAttributesPlainFactory.build();

    return {
      kind: "gs1-link" as const,
      passportId: randomUUID(),
      uniqueProductIdentifierId: randomUUID(),
      gs1DataAttributes,
    };
  },
);

// ---------------------------------------------------------------------------
// Update request factory
// ---------------------------------------------------------------------------

/** Raw PermalinkUpdateRequest (no 'kind' — immutable after create); default is an empty update. */
export const permalinkUpdateRequestPlainFactory = Factory.define<PermalinkUpdateRequest>(
  () => ({}),
);
