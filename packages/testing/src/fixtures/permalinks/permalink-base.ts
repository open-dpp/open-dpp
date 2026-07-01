import type { Gs1DataAttributes, PermalinkDto } from "@open-dpp/dto";
import { randomUUID } from "node:crypto";
import { gs1DataAttributesPlainFactory } from "../gs1/gs1-data-attributes.factory";

/** Transient inputs shared by the permalink DTO and public-DTO factories. */
export interface PermalinkBaseTransient {
  /** Set to true to flip the primary flag. */
  primary?: boolean;
  /** Set to true to produce a gs1-link permalink (kind, uniqueProductIdentifierId, gs1DataAttributes) instead of a presentation one. */
  gs1?: boolean;
}

/** Shared gs1/presentation branch for the permalink factories; fishery overlays the presentationConfigurationId/uniqueProductIdentifierId params, only gs1DataAttributes needs explicit replacement (fishery deep-merges nested objects). */
export function buildPermalinkCore(
  params: { gs1DataAttributes?: unknown },
  transientParams: PermalinkBaseTransient,
): PermalinkDto {
  const isGs1Link = transientParams.gs1 === true;
  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    kind: isGs1Link ? "gs1-link" : "presentation",
    slug: null,
    presentationConfigurationId: isGs1Link ? null : randomUUID(),
    uniqueProductIdentifierId: isGs1Link ? randomUUID() : null,
    primary: transientParams.primary ?? false,
    gs1DataAttributes: isGs1Link
      ? params.gs1DataAttributes !== undefined
        ? (params.gs1DataAttributes as Gs1DataAttributes | null)
        : gs1DataAttributesPlainFactory.build()
      : null,
    createdAt: now,
    updatedAt: now,
  };
}
