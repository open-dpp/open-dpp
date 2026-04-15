import { randomUUID } from "node:crypto";
import { IDigitalProductPassportIdentifiable } from "../../aas/domain/digital-product-passport-identifiable";
import { Environment } from "../../aas/domain/environment";
import { ExpandedEnvironmentPlain } from "../../aas/domain/expanded-environment";
import { IPersistable } from "../../aas/domain/persistable";
import {
  archiveDpp,
  DppStatus,
  DppStatusChange,
  IDppStatusChangeable,
  publishDpp,
  restoreDpp,
} from "../../dpp/domain/dpp-status";
import { SharedDppSchema } from "../../dpp/domain/dpp.schema";
import { DateTime } from "../../lib/date-time";
import { HasCreatedAt } from "../../lib/has-created-at";

export type ExpandedTemplatePlain = Omit<ReturnType<Template["toPlain"]>, "environment"> & {
  environment: ExpandedEnvironmentPlain;
};

const TemplateSchema = SharedDppSchema;

export class Template
  implements IPersistable, IDigitalProductPassportIdentifiable, HasCreatedAt, IDppStatusChangeable
{
  private constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly environment: Environment,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    private lastStatusChange: DppStatusChange,
  ) {}

  static create(data: {
    id?: string;
    organizationId: string;
    environment?: Environment;
    createdAt?: Date;
    updatedAt?: Date;
    lastStatusChange?: DppStatusChange;
  }) {
    const now = DateTime.now();
    return new Template(
      data.id ?? randomUUID(),
      data.organizationId,
      data.environment ?? Environment.create({}),
      data.createdAt ?? now,
      data.updatedAt ?? now,
      data.lastStatusChange ?? DppStatusChange.create({}),
    );
  }

  static fromPlain(data: unknown) {
    const parsed = TemplateSchema.parse(data);
    return new Template(
      parsed.id,
      parsed.organizationId,
      Environment.fromPlain(parsed.environment),
      new Date(parsed.createdAt),
      new Date(parsed.updatedAt),
      DppStatusChange.fromPlain(parsed.lastStatusChange),
    );
  }

  toPlain() {
    return {
      id: this.id,
      organizationId: this.organizationId,
      environment: this.environment.toPlain(),
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
    return this.lastStatusChange.currentStatus === DppStatus.Published;
  }

  isArchived(): boolean {
    return this.lastStatusChange.currentStatus === DppStatus.Archived;
  }

  isDraft(): boolean {
    return this.lastStatusChange.currentStatus === DppStatus.Draft;
  }
}
