import { randomUUID } from "node:crypto";
import { IDigitalProductDocument } from "../../digital-product-document/domain/digital-product-document";
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
import {
  PassportEditingMode,
  PassportEditingModeEnum,
  PassportEditingModeType,
} from "../../digital-product-document/domain/passport-editing-mode";
import { DateTime } from "../../lib/date-time";
import { HasCreatedAt } from "../../lib/has-created-at";
import {
  ChangeTracker,
  ITrackable,
  withTrackingHelper,
} from "../../activity-history/domain/change-tracker";
import { DigitalProductDocumentStatusChanged } from "../../activity-history/domain/change-events/digital-product-document-status-changed";
import { PassportEditingModeChanged } from "../../activity-history/domain/change-events/passport-editing-mode-changed";
import { DigitalProductDocumentTypes, DigitalProductDocumentTypesType } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";

const TemplateSchema = DigitalProductDocumentSchema.extend({
  passportEditingMode: PassportEditingModeEnum.default(PassportEditingMode.Full),
});

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
    private passportEditingMode: PassportEditingModeType,
  ) {}

  static create(data: {
    id?: string;
    organizationId: string;
    environment?: Environment;
    createdAt?: Date;
    updatedAt?: Date;
    lastStatusChange?: DigitalProductDocumentStatusChange;
    passportEditingMode?: PassportEditingModeType;
  }) {
    const now = DateTime.now();
    return new Template(
      data.id ?? randomUUID(),
      data.organizationId,
      data.environment ?? Environment.create({}),
      data.createdAt ?? now,
      data.updatedAt ?? now,
      data.lastStatusChange ?? DigitalProductDocumentStatusChange.create({}),
      data.passportEditingMode ?? PassportEditingMode.Full,
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
      parsed.passportEditingMode,
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
      passportEditingMode: this.passportEditingMode,
    };
  }
  getLastStatusChange() {
    return this.lastStatusChange;
  }

  getPassportEditingMode(): PassportEditingModeType {
    return this.passportEditingMode;
  }

  restrictPassportEditingToData(): void {
    if (this.passportEditingMode === PassportEditingMode.DataOnly) {
      throw new ValueError("Passport editing is already restricted to data for this template.");
    }
    this.tracker.track(
      PassportEditingModeChanged.create({
        oldValue: this.passportEditingMode,
        newValue: PassportEditingMode.DataOnly,
      }),
    );
    this.passportEditingMode = PassportEditingMode.DataOnly;
  }

  getEnvironment(): Environment {
    return this.environment;
  }

  getType(): DigitalProductDocumentTypesType {
    return DigitalProductDocumentTypes.Template;
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
