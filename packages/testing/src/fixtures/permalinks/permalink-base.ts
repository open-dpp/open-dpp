import type { Gs1DataAttributes, PermalinkDto } from "@open-dpp/dto";
import { randomUUID } from "node:crypto";
import { gs1DataAttributesPlainFactory } from "../gs1/gs1-data-attributes.factory";

export interface PermalinkBaseTransient {
  gs1?: boolean;
}

export function buildPermalinkCore(
  params: { gs1DataAttributes?: unknown },
  transientParams: PermalinkBaseTransient,
): PermalinkDto {
  const isGs1Link = transientParams.gs1 === true;
  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    kind: isGs1Link ? "gs1-link" : "open-dpp",
    passportId: randomUUID(),
    slug: null,
    presentationConfigurationId: isGs1Link ? null : randomUUID(),
    uniqueProductIdentifierId: isGs1Link ? randomUUID() : null,
    gs1DataAttributes: isGs1Link
      ? params.gs1DataAttributes !== undefined
        ? (params.gs1DataAttributes as Gs1DataAttributes | null)
        : gs1DataAttributesPlainFactory.build()
      : null,
    createdAt: now,
    updatedAt: now,
  };
}
