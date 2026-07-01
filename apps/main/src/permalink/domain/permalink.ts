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
import { ValueError } from "@open-dpp/exception";
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
    let parsed;
    try {
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
      parsed = PermalinkInvariantsSchema.parse(invariantsInput);
      if (data.id !== undefined) {
        z.uuid().parse(data.id);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
        throw new ValueError(`Invalid Permalink: ${details.join("; ")}`, { cause: error });
      }
      throw error;
    }
    const now = DateTime.now();
    const kind = parsed.kind;
    const presentationConfigurationId =
      kind === PermalinkKind.PRESENTATION
        ? (parsed as { presentationConfigurationId: string }).presentationConfigurationId
        : ((parsed as { presentationConfigurationId?: string | null })
            .presentationConfigurationId ?? null);
    const uniqueProductIdentifierId =
      kind === PermalinkKind.GS1_LINK
        ? (parsed as { uniqueProductIdentifierId: string }).uniqueProductIdentifierId
        : null;
    const gs1DataAttributes =
      kind === PermalinkKind.GS1_LINK
        ? ((parsed as { gs1DataAttributes?: Gs1DataAttributes | null }).gs1DataAttributes ?? null)
        : null;

    return new Permalink(
      data.id ?? randomUUID(),
      parsed.slug ?? null,
      parsed.baseUrl ?? null,
      null,
      presentationConfigurationId,
      data.createdAt ?? now,
      data.updatedAt ?? now,
      kind,
      data.primary ?? false,
      uniqueProductIdentifierId,
      gs1DataAttributes,
      data.organizationId ?? null,
    );
  }

  static fromPlain(data: unknown): Permalink {
    let parsed;
    try {
      parsed = PermalinkDtoSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
        throw new ValueError(`Invalid Permalink: ${details.join("; ")}`, { cause: error });
      }
      throw error;
    }
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
    let validated: string | null = null;
    if (slug !== null) {
      const result = PermalinkSlugSchema.safeParse(slug);
      if (!result.success) {
        const details = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
        throw new ValueError(`Invalid Permalink slug: ${details.join("; ")}`, {
          cause: result.error,
        });
      }
      validated = result.data;
    }
    return new Permalink(
      this.id,
      validated,
      this.baseUrl,
      this.publishedUrl,
      this.presentationConfigurationId,
      this.createdAt,
      DateTime.now(),
      this.kind,
      this.primary,
      this.uniqueProductIdentifierId,
      this.gs1DataAttributes,
      this.organizationId,
    );
  }

  withBaseUrl(baseUrl: string | null): Permalink {
    this.assertNotPublished();
    let validated: string | null = null;
    if (baseUrl !== null) {
      const result = PermalinkBaseUrlSchema.safeParse(baseUrl);
      if (!result.success) {
        const details = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
        throw new ValueError(`Invalid Permalink base URL: ${details.join("; ")}`, {
          cause: result.error,
        });
      }
      validated = result.data;
    }
    return new Permalink(
      this.id,
      this.slug,
      validated,
      this.publishedUrl,
      this.presentationConfigurationId,
      this.createdAt,
      DateTime.now(),
      this.kind,
      this.primary,
      this.uniqueProductIdentifierId,
      this.gs1DataAttributes,
      this.organizationId,
    );
  }

  withPublishedUrl(url: string): Permalink {
    if (this.publishedUrl !== null) {
      throw new ValueError("Permalink publishedUrl is immutable once set and cannot be changed.");
    }
    const result = PermalinkPublishedUrlSchema.safeParse(url);
    if (!result.success) {
      const details = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      throw new ValueError(`Invalid Permalink published URL: ${details.join("; ")}`, {
        cause: result.error,
      });
    }
    return new Permalink(
      this.id,
      this.slug,
      this.baseUrl,
      result.data,
      this.presentationConfigurationId,
      this.createdAt,
      DateTime.now(),
      this.kind,
      this.primary,
      this.uniqueProductIdentifierId,
      this.gs1DataAttributes,
      this.organizationId,
    );
  }

  private assertNotPublished(): void {
    if (this.publishedUrl !== null) {
      throw new ValueError("Cannot modify a published permalink; slug and baseUrl are locked.");
    }
  }

  withPrimary(primary: boolean): Permalink {
    // primary governs resolution — not frozen post-publish (per Slice 18 design decision)
    return new Permalink(
      this.id,
      this.slug,
      this.baseUrl,
      this.publishedUrl,
      this.presentationConfigurationId,
      this.createdAt,
      DateTime.now(),
      this.kind,
      primary,
      this.uniqueProductIdentifierId,
      this.gs1DataAttributes,
      this.organizationId,
    );
  }

  private assertGs1Kind(): void {
    if (this.kind !== PermalinkKind.GS1_LINK) {
      throw new ValueError("This operation is only allowed on a gs1-link permalink.");
    }
  }

  withGs1DataAttributes(attrs: Gs1DataAttributes | null): Permalink {
    this.assertGs1Kind();
    this.assertNotPublished();
    let validated: Gs1DataAttributes | null = null;
    if (attrs !== null) {
      const result = Gs1DataAttributesSchema.safeParse(attrs);
      if (!result.success) {
        const details = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
        throw new ValueError(`Invalid GS1 data attributes: ${details.join("; ")}`, {
          cause: result.error,
        });
      }
      validated = result.data;
    }
    return new Permalink(
      this.id,
      this.slug,
      this.baseUrl,
      this.publishedUrl,
      this.presentationConfigurationId,
      this.createdAt,
      DateTime.now(),
      this.kind,
      this.primary,
      this.uniqueProductIdentifierId,
      validated,
      this.organizationId,
    );
  }
}
