import { randomUUID } from "node:crypto";
import {
  Gs1DataAttributes,
  Gs1DataAttributesSchema,
  PermalinkBaseUrlSchema,
  PermalinkDtoSchema,
  PermalinkInvariantsSchema,
  PermalinkKind,
  PermalinkKindType,
  PermalinkPublishedUrlSchema,
  PermalinkSlugSchema,
} from "@open-dpp/dto";
import { parseOrThrow, ValueError } from "@open-dpp/exception";
import { z } from "zod/v4";
import { IPersistable } from "../../aas/domain/persistable";
import { DateTime } from "../../lib/date-time";
import { HasCreatedAt } from "../../lib/has-created-at";

export class Permalink implements IPersistable, HasCreatedAt {
  private constructor(
    public readonly id: string,
    public readonly passportId: string,
    public readonly slug: string | null,
    public readonly baseUrl: string | null,
    public readonly publishedUrl: string | null,
    public readonly presentationConfigurationId: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly kind: PermalinkKindType,
    public readonly uniqueProductIdentifierId: string | null,
    public readonly gs1DataAttributes: Gs1DataAttributes | null,
    public readonly organizationId: string | null,
  ) {}

  static create(data: {
    id?: string;
    kind?: PermalinkKindType;
    passportId: string;
    presentationConfigurationId?: string | null;
    uniqueProductIdentifierId?: string | null;
    slug?: string | null;
    baseUrl?: string | null;
    gs1DataAttributes?: Gs1DataAttributes | null;
    createdAt?: Date;
    updatedAt?: Date;
    organizationId?: string | null;
  }): Permalink {
    const kind = data.kind ?? PermalinkKind.OPEN_DPP;
    const baseFields = {
      kind,
      passportId: data.passportId,
      slug: data.slug ?? null,
      baseUrl: data.baseUrl ?? null,
    };
    let invariantsInput: Record<string, unknown>;
    if (kind === PermalinkKind.GS1_LINK) {
      invariantsInput = {
        ...baseFields,
        uniqueProductIdentifierId: data.uniqueProductIdentifierId,
        presentationConfigurationId: data.presentationConfigurationId ?? null,
        gs1DataAttributes: data.gs1DataAttributes ?? null,
      };
    } else {
      // For open-dpp kind, pass gs1DataAttributes through so the strict schema rejects it if set
      invariantsInput = {
        ...baseFields,
        presentationConfigurationId: data.presentationConfigurationId ?? null,
        uniqueProductIdentifierId: data.uniqueProductIdentifierId ?? null,
        ...(data.gs1DataAttributes !== undefined && {
          gs1DataAttributes: data.gs1DataAttributes,
        }),
      };
    }
    const parsed = parseOrThrow(PermalinkInvariantsSchema, invariantsInput, "Permalink");
    if (data.id !== undefined) {
      parseOrThrow(z.uuid(), data.id, "Permalink");
    }
    const now = DateTime.now();

    let uniqueProductIdentifierId: string | null;
    let gs1DataAttributes: Gs1DataAttributes | null;
    if (parsed.kind === PermalinkKind.GS1_LINK) {
      uniqueProductIdentifierId = parsed.uniqueProductIdentifierId;
      gs1DataAttributes = parsed.gs1DataAttributes ?? null;
    } else {
      uniqueProductIdentifierId = parsed.uniqueProductIdentifierId ?? null;
      gs1DataAttributes = null;
    }

    return new Permalink(
      data.id ?? randomUUID(),
      parsed.passportId,
      parsed.slug ?? null,
      parsed.baseUrl ?? null,
      null,
      parsed.presentationConfigurationId ?? null,
      data.createdAt ?? now,
      data.updatedAt ?? now,
      parsed.kind,
      uniqueProductIdentifierId,
      gs1DataAttributes,
      data.organizationId ?? null,
    );
  }

  static fromPlain(data: unknown): Permalink {
    const parsed = parseOrThrow(PermalinkDtoSchema, data, "Permalink");
    const rawData = data as Record<string, unknown>;
    const organizationId =
      typeof rawData.organizationId === "string" ? rawData.organizationId : null;
    return new Permalink(
      parsed.id,
      parsed.passportId,
      parsed.slug,
      parsed.baseUrl ?? null,
      parsed.publishedUrl ?? null,
      parsed.presentationConfigurationId,
      new Date(parsed.createdAt),
      new Date(parsed.updatedAt),
      parsed.kind,
      parsed.uniqueProductIdentifierId,
      parsed.gs1DataAttributes,
      organizationId,
    );
  }

  toPlain() {
    return {
      id: this.id,
      kind: this.kind,
      passportId: this.passportId,
      slug: this.slug,
      baseUrl: this.baseUrl,
      publishedUrl: this.publishedUrl,
      presentationConfigurationId: this.presentationConfigurationId,
      uniqueProductIdentifierId: this.uniqueProductIdentifierId,
      gs1DataAttributes: this.gs1DataAttributes,
      organizationId: this.organizationId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  withSlug(slug: string | null): Permalink {
    this.assertNotPublished();
    const validated =
      slug === null ? null : parseOrThrow(PermalinkSlugSchema, slug, "Permalink slug");
    return this.copy({ slug: validated });
  }

  withBaseUrl(baseUrl: string | null): Permalink {
    this.assertNotPublished();
    const validated =
      baseUrl === null ? null : parseOrThrow(PermalinkBaseUrlSchema, baseUrl, "Permalink base URL");
    return this.copy({ baseUrl: validated });
  }

  withPublishedUrl(url: string): Permalink {
    if (this.publishedUrl !== null) {
      throw new ValueError("Permalink publishedUrl is immutable once set and cannot be changed.");
    }
    const validated = parseOrThrow(PermalinkPublishedUrlSchema, url, "Permalink published URL");
    return this.copy({ publishedUrl: validated });
  }

  withPresentationConfigurationId(presentationConfigurationId: string | null): Permalink {
    this.assertNotPublished();
    if (presentationConfigurationId !== null) {
      parseOrThrow(z.uuid(), presentationConfigurationId, "Permalink presentationConfigurationId");
    }
    return this.copy({ presentationConfigurationId });
  }

  private assertNotPublished(): void {
    if (this.publishedUrl !== null) {
      throw new ValueError(
        "Cannot modify a published permalink; slug, baseUrl, and presentation configuration are locked.",
      );
    }
  }

  private assertGs1Kind(): void {
    if (this.kind !== PermalinkKind.GS1_LINK) {
      throw new ValueError("This operation is only allowed on a gs1-link permalink.");
    }
  }

  withGs1DataAttributes(attrs: Gs1DataAttributes | null): Permalink {
    this.assertGs1Kind();
    this.assertNotPublished();
    const validated =
      attrs === null ? null : parseOrThrow(Gs1DataAttributesSchema, attrs, "GS1 data attributes");
    return this.copy({ gs1DataAttributes: validated });
  }

  /**
   * Clone this permalink, applying `overrides` and advancing `updatedAt`.
   * Spreading over a full snapshot keeps the single positional constructor call
   * in one place and removes the transposition hazard of the six `string | null`
   * fields — an explicit `null` override wins, an absent key keeps the current
   * value.
   */
  private copy(
    overrides: Partial<{
      id: string;
      passportId: string;
      slug: string | null;
      baseUrl: string | null;
      publishedUrl: string | null;
      presentationConfigurationId: string | null;
      createdAt: Date;
      updatedAt: Date;
      kind: PermalinkKindType;
      uniqueProductIdentifierId: string | null;
      gs1DataAttributes: Gs1DataAttributes | null;
      organizationId: string | null;
    }>,
  ): Permalink {
    const s = {
      id: this.id,
      passportId: this.passportId,
      slug: this.slug,
      baseUrl: this.baseUrl,
      publishedUrl: this.publishedUrl,
      presentationConfigurationId: this.presentationConfigurationId,
      createdAt: this.createdAt,
      updatedAt: DateTime.now(),
      kind: this.kind,
      uniqueProductIdentifierId: this.uniqueProductIdentifierId,
      gs1DataAttributes: this.gs1DataAttributes,
      organizationId: this.organizationId,
      ...overrides,
    };
    return new Permalink(
      s.id,
      s.passportId,
      s.slug,
      s.baseUrl,
      s.publishedUrl,
      s.presentationConfigurationId,
      s.createdAt,
      s.updatedAt,
      s.kind,
      s.uniqueProductIdentifierId,
      s.gs1DataAttributes,
      s.organizationId,
    );
  }
}
