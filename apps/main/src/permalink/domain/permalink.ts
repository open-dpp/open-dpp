import { randomUUID } from "node:crypto";
import {
  PermalinkBaseUrlSchema,
  PermalinkDtoSchema,
  PermalinkInvariantsSchema,
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
    public readonly presentationConfigurationId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(data: {
    id?: string;
    presentationConfigurationId: string;
    slug?: string | null;
    baseUrl?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  }): Permalink {
    let parsed;
    try {
      parsed = PermalinkInvariantsSchema.parse({
        presentationConfigurationId: data.presentationConfigurationId,
        slug: data.slug ?? null,
        baseUrl: data.baseUrl ?? null,
      });
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
    return new Permalink(
      data.id ?? randomUUID(),
      parsed.slug,
      parsed.baseUrl ?? null,
      null,
      parsed.presentationConfigurationId,
      data.createdAt ?? now,
      data.updatedAt ?? now,
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
    return new Permalink(
      parsed.id,
      parsed.slug,
      parsed.baseUrl ?? null,
      parsed.publishedUrl ?? null,
      parsed.presentationConfigurationId,
      new Date(parsed.createdAt),
      new Date(parsed.updatedAt),
    );
  }

  toPlain() {
    return {
      id: this.id,
      slug: this.slug,
      baseUrl: this.baseUrl,
      publishedUrl: this.publishedUrl,
      presentationConfigurationId: this.presentationConfigurationId,
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
    );
  }

  private assertNotPublished(): void {
    if (this.publishedUrl !== null) {
      throw new ValueError("Cannot modify a published permalink; slug and baseUrl are locked.");
    }
  }
}
