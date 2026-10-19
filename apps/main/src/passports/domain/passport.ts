import { randomUUID } from "node:crypto";
import {
  DigitalProductDocumentTypes,
  DigitalProductDocumentTypesType,
  PassportDtoSchema,
} from "@open-dpp/dto";
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
import {
  PassportEditingMode,
  PassportEditingModeType,
} from "../../digital-product-document/domain/passport-editing-mode";
import { DateTime } from "../../lib/date-time";
import { HasCreatedAt } from "../../lib/has-created-at";
import { UniqueProductIdentifier } from "../../unique-product-identifier/domain/unique.product.identifier";
import {
  ChangeTracker,
  ITrackable,
  withTrackingHelper,
} from "../../activity-history/domain/change-tracker";
import { DigitalProductDocumentStatusChanged } from "../../activity-history/domain/change-events/digital-product-document-status-changed";
import { PassportEditingModeChanged } from "../../activity-history/domain/change-events/passport-editing-mode-changed";
import { ValueError } from "@open-dpp/exception";

export class Passport
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
    public readonly templateId: string | null,
    public readonly environment: Environment,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    private lastStatusChange: DigitalProductDocumentStatusChange,
    private editingMode: PassportEditingModeType,
  ) {}

  static create(data: {
    id?: string;
    organizationId: string;
    templateId?: string;
    environment: Environment;
    createdAt?: Date;
    updatedAt?: Date;
    lastStatusChange?: DigitalProductDocumentStatusChange;
    editingMode?: PassportEditingModeType;
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
      data.editingMode ?? PassportEditingMode.Full,
    );
  }

  static fromPlain(data: unknown) {
    const parsed = PassportDtoSchema.parse(data);
    return new Passport(
      parsed.id,
      parsed.organizationId,
      parsed.templateId,
      Environment.fromPlain(parsed.environment),
      new Date(parsed.createdAt),
      new Date(parsed.updatedAt),
      DigitalProductDocumentStatusChange.fromPlain(parsed.lastStatusChange),
      parsed.editingMode,
    );
  }

  withTracking(changeTracker?: ChangeTracker) {
    const result = withTrackingHelper(changeTracker, this);
    this.environment.withTracking(result.tracker);
    return result;
  }

  toPlain() {
    return {
      id: this.id,
      organizationId: this.organizationId,
      environment: this.environment.toPlain(),
      templateId: this.templateId,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      lastStatusChange: this.lastStatusChange.toPlain(),
      editingMode: this.editingMode,
    };
  }

  getEnvironment(): Environment {
    return this.environment;
  }

  getType(): DigitalProductDocumentTypesType {
    return DigitalProductDocumentTypes.Passport;
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

  getEditingMode(): PassportEditingModeType {
    return this.editingMode;
  }

  removeEditingRestrictions(): void {
    if (this.editingMode === PassportEditingMode.Full) {
      throw new ValueError("This passport's editing is not restricted.");
    }
    this.tracker.track(
      PassportEditingModeChanged.create({
        oldValue: this.editingMode,
        newValue: PassportEditingMode.Full,
      }),
    );
    this.editingMode = PassportEditingMode.Full;
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
