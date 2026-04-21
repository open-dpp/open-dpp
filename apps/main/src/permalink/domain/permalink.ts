import { randomUUID } from "node:crypto";
import { PermalinkDtoSchema, PermalinkInvariantsSchema, PermalinkSlugSchema } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { z } from "zod/v4";
import { IPersistable } from "../../aas/domain/persistable";
import { DateTime } from "../../lib/date-time";
import { HasCreatedAt } from "../../lib/has-created-at";

export class Permalink implements IPersistable, HasCreatedAt {
  private constructor(
    public readonly id: string,
    public readonly slug: string | null,
    public readonly presentationConfigurationId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(data: {
    id?: string;
    presentationConfigurationId: string;
    slug?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  }): Permalink {
    try {
      PermalinkInvariantsSchema.parse({
        presentationConfigurationId: data.presentationConfigurationId,
        slug: data.slug ?? null,
      });
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
      data.slug ?? null,
      data.presentationConfigurationId,
      data.createdAt ?? now,
      data.updatedAt ?? now,
    );
  }

  static fromPlain(data: unknown): Permalink {
    const parsed = PermalinkDtoSchema.parse(data);
    return new Permalink(
      parsed.id,
      parsed.slug,
      parsed.presentationConfigurationId,
      new Date(parsed.createdAt),
      new Date(parsed.updatedAt),
    );
  }

  toPlain() {
    return {
      id: this.id,
      slug: this.slug,
      presentationConfigurationId: this.presentationConfigurationId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  withSlug(slug: string | null): Permalink {
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
      this.presentationConfigurationId,
      this.createdAt,
      DateTime.now(),
    );
  }
}
