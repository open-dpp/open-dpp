import { randomUUID } from "node:crypto";
import { z } from "zod";
import { IDigitalProductPassportIdentifiable } from "../../aas/domain/digital-product-passport-identifiable";
import { Environment } from "../../aas/domain/environment";
import { IPersistable } from "../../aas/domain/persistable";
import {
  archiveDpp,
  DigitalProductDocumentStatus,
  DigitalProductDocumentStatusChange,
  IDigitalProductDocumentStatusChangeable,
  publishDpp,
  restoreDpp,
} from "../../digital-product-document/domain/digital-product-document-status";
import { DigitalProductDocumentSchema } from "../../digital-product-document/domain/digital-product-document.schema";
import { DateTime } from "../../lib/date-time";
import { HasCreatedAt } from "../../lib/has-created-at";
import { UniqueProductIdentifier } from "../../unique-product-identifier/domain/unique.product.identifier";

const PassportSchema = DigitalProductDocumentSchema.extend({
  templateId: z.string().nullable(),
  /** UPI uuid for presentation/chat links; set when listing passports */
  uniqueProductIdentifierUuid: z.uuid().optional(),
});

export class Passport
  implements
    IPersistable,
    IDigitalProductPassportIdentifiable,
    HasCreatedAt,
    IDigitalProductDocumentStatusChangeable
{
  private constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly templateId: string | null,
    public readonly environment: Environment,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    private lastStatusChange: DigitalProductDocumentStatusChange,
  ) {}

  static create(data: {
    id?: string;
    organizationId: string;
    templateId?: string;
    environment: Environment;
    createdAt?: Date;
    updatedAt?: Date;
    lastStatusChange?: DigitalProductDocumentStatusChange;
  }) {
    const now = DateTime.now();

    return new Passport(
      data.id ?? randomUUID(),
      data.organizationId,
      data.templateId ?? null,
      data.environment,
      data.createdAt ?? now,
      data.updatedAt ?? now,
      data.lastStatusChange ?? DigitalProductDocumentStatusChange.create({}),
    );
  }

  static fromPlain(data: unknown) {
    const parsed = PassportSchema.parse(data);
    return new Passport(
      parsed.id,
      parsed.organizationId,
      parsed.templateId,
      Environment.fromPlain(parsed.environment),
      new Date(parsed.createdAt),
      new Date(parsed.updatedAt),
      DigitalProductDocumentStatusChange.fromPlain(parsed.lastStatusChange),
    );
  }

  toPlain() {
    return {
      id: this.id,
      organizationId: this.organizationId,
      environment: this.environment.toPlain(),
      templateId: this.templateId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastStatusChange: this.lastStatusChange.toPlain(),
    };
  }

  getEnvironment(): Environment {
    return this.environment;
  }

  getOrganizationId(): string {
    return this.organizationId;
  }

  createUniqueProductIdentifier(): UniqueProductIdentifier {
    return UniqueProductIdentifier.create({
      referenceId: this.id,
    });
  }

  getLastStatusChange(): DigitalProductDocumentStatusChange {
    return this.lastStatusChange;
  }

  publish() {
    this.lastStatusChange = publishDpp(this.lastStatusChange);
  }

  archive() {
    this.lastStatusChange = archiveDpp(this.lastStatusChange);
  }

  restore() {
    this.lastStatusChange = restoreDpp(this.lastStatusChange);
  }

  isPublished(): boolean {
    return this.lastStatusChange.currentStatus === DigitalProductDocumentStatus.Published;
  }

  isArchived(): boolean {
    return this.lastStatusChange.currentStatus === DigitalProductDocumentStatus.Archived;
  }

  isDraft(): boolean {
    return this.lastStatusChange.currentStatus === DigitalProductDocumentStatus.Draft;
  }
}
