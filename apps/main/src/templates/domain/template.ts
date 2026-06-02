import { randomUUID } from "node:crypto";
import { IDigitalProductDocument } from "../../digital-product-document/domain/digital-product-document";
import { Environment } from "../../aas/domain/environment";
import { ExpandedEnvironmentPlain } from "../../aas/domain/expanded-environment";
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
import {
  ChangeTracker,
  ITrackable,
  withTrackingHelper,
} from "../../activity-history/domain/change-tracker";
import { DigitalProductDocumentStatusChanged } from "../../activity-history/domain/change-events/digital-product-document-status-changed";
import { IActivity } from "../../activity-history/domain/activities/shared.activity";

export type ExpandedTemplatePlain = Omit<ReturnType<Template["toPlain"]>, "environment"> & {
  environment: ExpandedEnvironmentPlain;
};

const TemplateSchema = DigitalProductDocumentSchema;

export class Template
  implements
    IPersistable,
    IDigitalProductDocument,
    HasCreatedAt,
    IDigitalProductDocumentStatusChangeable,
    ITrackable
{
  readonly tracker = ChangeTracker.create();

  private constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly environment: Environment,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    private lastStatusChange: DigitalProductDocumentStatusChange,
  ) {}

  static create(data: {
    id?: string;
    organizationId: string;
    environment?: Environment;
    createdAt?: Date;
    updatedAt?: Date;
    lastStatusChange?: DigitalProductDocumentStatusChange;
  }) {
    const now = DateTime.now();
    return new Template(
      data.id ?? randomUUID(),
      data.organizationId,
      data.environment ?? Environment.create({}),
      data.createdAt ?? now,
      data.updatedAt ?? now,
      data.lastStatusChange ?? DigitalProductDocumentStatusChange.create({}),
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
      DigitalProductDocumentStatusChange.fromPlain(parsed.lastStatusChange),
    );
  }

  withTracking(changeTracker?: ChangeTracker): this {
    const result = withTrackingHelper(changeTracker, this);
    this.environment.withTracking(this.tracker);
    return result;
  }

  toPlain() {
    return {
      id: this.id,
      organizationId: this.organizationId,
      environment: this.environment.toPlain(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      lastStatusChange: this.lastStatusChange.toPlain(),
    };
  }
  getLastStatusChange() {
    return this.lastStatusChange;
  }

  getEnvironment(): Environment {
    return this.environment;
  }

  getOrganizationId(): string {
    return this.organizationId;
  }

  publish() {
    this.setLastStatusChange(publishDpp(this.lastStatusChange));
  }

  archive() {
    this.setLastStatusChange(archiveDpp(this.lastStatusChange));
  }

  restore() {
    this.setLastStatusChange(restoreDpp(this.lastStatusChange));
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
  private setLastStatusChange(lastStatusChange: DigitalProductDocumentStatusChange) {
    this.lastStatusChange = lastStatusChange;
    this.tracker.track(
      DigitalProductDocumentStatusChanged.create({
        digitalProductDocumentStatusChange: lastStatusChange,
      }),
    );
  }
}
