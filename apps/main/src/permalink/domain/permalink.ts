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
    public readonly slug: string | null,
    public readonly baseUrl: string | null,
    public readonly publishedUrl: string | null,
    public readonly presentationConfigurationId: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly kind: PermalinkKindType,
    public readonly primary: boolean,
    public readonly uniqueProductIdentifierId: string | null,
    public readonly gs1DataAttributes: Gs1DataAttributes | null,
    public readonly organizationId: string | null,
  ) {}

  static create(data: {
    id?: string;
    kind?: PermalinkKindType;
    presentationConfigurationId?: string | null;
    uniqueProductIdentifierId?: string | null;
    primary?: boolean;
    slug?: string | null;
    baseUrl?: string | null;
    gs1DataAttributes?: Gs1DataAttributes | null;
    createdAt?: Date;
    updatedAt?: Date;
    organizationId?: string | null;
  }): Permalink {
    const kind = data.kind ?? PermalinkKind.PRESENTATION;
    const baseFields = {
      kind,
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
      // For presentation kind, pass the gs1 fields so the schema can reject them if set
      invariantsInput = {
        ...baseFields,
        presentationConfigurationId: data.presentationConfigurationId,
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

    let presentationConfigurationId: string | null;
    let uniqueProductIdentifierId: string | null;
    let gs1DataAttributes: Gs1DataAttributes | null;
    if (parsed.kind === PermalinkKind.GS1_LINK) {
      presentationConfigurationId = parsed.presentationConfigurationId ?? null;
      uniqueProductIdentifierId = parsed.uniqueProductIdentifierId;
      gs1DataAttributes = parsed.gs1DataAttributes ?? null;
    } else {
      presentationConfigurationId = parsed.presentationConfigurationId;
      uniqueProductIdentifierId = null;
      gs1DataAttributes = null;
    }

    return new Permalink(
      data.id ?? randomUUID(),
      parsed.slug ?? null,
      parsed.baseUrl ?? null,
      null,
      presentationConfigurationId,
      data.createdAt ?? now,
      data.updatedAt ?? now,
      parsed.kind,
      data.primary ?? false,
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
      parsed.slug,
      parsed.baseUrl ?? null,
      parsed.publishedUrl ?? null,
      parsed.presentationConfigurationId,
      new Date(parsed.createdAt),
      new Date(parsed.updatedAt),
      parsed.kind,
      parsed.primary,
      parsed.uniqueProductIdentifierId,
      parsed.gs1DataAttributes,
      organizationId,
    );
  }

  toPlain() {
    return {
      id: this.id,
      kind: this.kind,
      slug: this.slug,
      baseUrl: this.baseUrl,
      publishedUrl: this.publishedUrl,
      presentationConfigurationId: this.presentationConfigurationId,
      primary: this.primary,
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

  private assertNotPublished(): void {
    if (this.publishedUrl !== null) {
      throw new ValueError("Cannot modify a published permalink; slug and baseUrl are locked.");
    }
  }

  withPrimary(primary: boolean): Permalink {
    // primary governs resolution — not frozen post-publish (per Slice 18 design decision)
    return this.copy({ primary });
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
      slug: string | null;
      baseUrl: string | null;
      publishedUrl: string | null;
      presentationConfigurationId: string | null;
      createdAt: Date;
      updatedAt: Date;
      kind: PermalinkKindType;
      primary: boolean;
      uniqueProductIdentifierId: string | null;
      gs1DataAttributes: Gs1DataAttributes | null;
      organizationId: string | null;
    }>,
  ): Permalink {
    const s = {
      id: this.id,
      slug: this.slug,
      baseUrl: this.baseUrl,
      publishedUrl: this.publishedUrl,
      presentationConfigurationId: this.presentationConfigurationId,
      createdAt: this.createdAt,
      updatedAt: DateTime.now(),
      kind: this.kind,
      primary: this.primary,
      uniqueProductIdentifierId: this.uniqueProductIdentifierId,
      gs1DataAttributes: this.gs1DataAttributes,
      organizationId: this.organizationId,
      ...overrides,
    };
    return new Permalink(
      s.id,
      s.slug,
      s.baseUrl,
      s.publishedUrl,
      s.presentationConfigurationId,
      s.createdAt,
      s.updatedAt,
      s.kind,
      s.primary,
      s.uniqueProductIdentifierId,
      s.gs1DataAttributes,
      s.organizationId,
    );
  }
}
