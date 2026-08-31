import type { Gs1DataAttributes, PermalinkUpdateRequest } from "@open-dpp/dto";
import { randomUUID } from "node:crypto";
import { Factory } from "fishery";
import { gs1DataAttributesPlainFactory } from "../gs1/gs1-data-attributes.factory";

interface OpenDppCreateRequestRaw {
  kind: "open-dpp";
  passportId: string;
  presentationConfigurationId?: string | null;
  uniqueProductIdentifierId?: string | null;
  slug?: string | null;
  baseUrl?: string | null;
}

export const permalinkCreateRequestPlainFactory = Factory.define<OpenDppCreateRequestRaw>(() => ({
  kind: "open-dpp" as const,
  passportId: randomUUID(),
}));

interface Gs1LinkCreateRequestRaw {
  kind: "gs1-link";
  passportId: string;
  uniqueProductIdentifierId: string;
  presentationConfigurationId?: string | null;
  gs1DataAttributes?: Gs1DataAttributes | null;
  slug?: string | null;
  baseUrl?: string | null;
}

export const permalinkGs1LinkCreateRequestPlainFactory = Factory.define<Gs1LinkCreateRequestRaw>(
  ({ params }) => {
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

export const permalinkUpdateRequestPlainFactory = Factory.define<PermalinkUpdateRequest>(
  () => ({}),
);
