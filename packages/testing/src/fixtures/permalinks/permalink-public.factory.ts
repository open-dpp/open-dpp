import type { Gs1DataAttributes, PermalinkPublicDtoSchema } from "@open-dpp/dto";
import type { z } from "zod";
import { randomUUID } from "node:crypto";
import { Factory } from "fishery";
import { gs1DataAttributesPlainFactory } from "../gs1/gs1-data-attributes.factory";

interface PermalinkPublicTransient {
  presentationConfigurationId?: string | null;
  slug?: string | null;
  /** Set to true to flip the primary flag */
  primary?: boolean;
  /**
   * Set to true to produce a gs1-link permalink public DTO instead of a presentation one.
   * The factory will set kind='gs1-link', uniqueProductIdentifierId, gs1DataAttributes,
   * and gs1ResolverBase automatically unless they are overridden in the build params.
   */
  gs1?: boolean;
}

export const permalinkPublicPlainFactory = Factory.define<
  z.infer<typeof PermalinkPublicDtoSchema>,
  PermalinkPublicTransient
>(({ params, transientParams }) => {
  const isGs1Link = transientParams.gs1 === true;

  const publicUrl = "https://example.com/p/" + randomUUID();
  const fallbackBaseUrl = "https://example.com";
  const fallbackBaseUrlSource: "branding" | "instance" = "instance";
  const now = new Date().toISOString();

  if (isGs1Link) {
    const uniqueProductIdentifierId =
      params.uniqueProductIdentifierId !== undefined
        ? params.uniqueProductIdentifierId
        : randomUUID();

    const presentationConfigurationId =
      transientParams.presentationConfigurationId !== undefined
        ? transientParams.presentationConfigurationId
        : params.presentationConfigurationId !== undefined
          ? params.presentationConfigurationId
          : null;

    const gs1DataAttributes: Gs1DataAttributes | null =
      params.gs1DataAttributes !== undefined
        ? (params.gs1DataAttributes as Gs1DataAttributes | null)
        : gs1DataAttributesPlainFactory.build();

    const gs1ResolverBase =
      params.gs1ResolverBase !== undefined ? params.gs1ResolverBase : "https://id.gs1.org";

    return {
      id: randomUUID(),
      kind: "gs1-link" as const,
      slug: transientParams.slug ?? null,
      baseUrl: null,
      publishedUrl: null,
      presentationConfigurationId,
      uniqueProductIdentifierId,
      primary: transientParams.primary ?? false,
      gs1ResolverBase,
      gs1DataAttributes,
      createdAt: now,
      updatedAt: now,
      publicUrl,
      fallbackBaseUrl,
      fallbackBaseUrlSource,
    };
  }

  return {
    id: randomUUID(),
    kind: "presentation" as const,
    slug: transientParams.slug ?? null,
    baseUrl: null,
    publishedUrl: null,
    presentationConfigurationId:
      transientParams.presentationConfigurationId !== undefined
        ? transientParams.presentationConfigurationId
        : params.presentationConfigurationId !== undefined
          ? params.presentationConfigurationId
          : randomUUID(),
    uniqueProductIdentifierId: null,
    primary: transientParams.primary ?? false,
    gs1ResolverBase: null,
    gs1DataAttributes: null,
    createdAt: now,
    updatedAt: now,
    publicUrl,
    fallbackBaseUrl,
    fallbackBaseUrlSource,
  };
});
