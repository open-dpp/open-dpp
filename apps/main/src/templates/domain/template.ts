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
import { IActivity } from "../../activity-history/activity";
import { DigitalProductDocumentActivity } from "../../activity-history/domain/digital-product-document.activity";
import { DigitalProductDocumentOperationTypes } from "../../activity-history/digital-product-document-operation-types";

export type ExpandedTemplatePlain = Omit<ReturnType<Template["toPlain"]>, "environment"> & {
  environment: ExpandedEnvironmentPlain;
};

const TemplateSchema = DigitalProductDocumentSchema;

export class Template
  implements
    IPersistable,
    IDigitalProductDocument,
    HasCreatedAt,
    IDigitalProductDocumentStatusChangeable
{
  private _activities: Array<IActivity> = [];

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

  private publishActivity(activity: IActivity) {
    this._activities.push(activity);
  }

  get activities(): Array<IActivity> {
    return this._activities;
  }

  pullActivities(correlationId: string): Array<IActivity> {
    const events = [...this._activities];
    events.forEach((event) => event.header.assignCorrelationId(correlationId));

    this._activities = [];
    return events;
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
    const oldData = structuredClone(this.toPlain());
    this.lastStatusChange = lastStatusChange;
    this.publishActivity(
      DigitalProductDocumentActivity.create({
        digitalProductDocumentId: this.id,
        oldData,
        newData: structuredClone(this.toPlain()),
        operation: DigitalProductDocumentOperationTypes.StatusModified,
      }),
    );
  }
}
