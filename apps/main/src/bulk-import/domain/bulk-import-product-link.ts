import { randomUUID } from "node:crypto";
import { z } from "zod";
import { IPersistable } from "../../aas/domain/persistable";
import { DateTime } from "../../lib/date-time";

/**
 * Not exposed through any API - purely internal bookkeeping that lets a
 * BulkImportConfig recognize a row it (or a sibling config targeting the
 * same template) has already turned into a passport, so re-running a file
 * updates instead of duplicating.
 */
export const BulkImportProductLinkSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  templateId: z.string(),
  externalIdValue: z.string(),
  passportId: z.string(),
  createdAt: z.union([z.iso.datetime(), z.date()]),
});

export class BulkImportProductLink implements IPersistable {
  private constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly templateId: string,
    public readonly externalIdValue: string,
    public readonly passportId: string,
    public readonly createdAt: Date,
  ) {}

  static create(data: {
    id?: string;
    organizationId: string;
    templateId: string;
    externalIdValue: string;
    passportId: string;
    createdAt?: Date;
  }): BulkImportProductLink {
    return new BulkImportProductLink(
      data.id ?? randomUUID(),
      data.organizationId,
      data.templateId,
      data.externalIdValue,
      data.passportId,
      data.createdAt ?? DateTime.now(),
    );
  }

  static fromPlain(data: unknown): BulkImportProductLink {
    const parsed = BulkImportProductLinkSchema.parse(data);
    return new BulkImportProductLink(
      parsed.id,
      parsed.organizationId,
      parsed.templateId,
      parsed.externalIdValue,
      parsed.passportId,
      new Date(parsed.createdAt),
    );
  }

  toPlain() {
    return {
      id: this.id,
      organizationId: this.organizationId,
      templateId: this.templateId,
      externalIdValue: this.externalIdValue,
      passportId: this.passportId,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
