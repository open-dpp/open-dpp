import {
  DigitalProductDocumentStatusChangeDtoSchema,
  DigitalProductDocumentStatusDto,
  DigitalProductDocumentStatusDtoEnum,
  DigitalProductDocumentStatusDtoType,
  DigitalProductDocumentStatusModificationDto,
} from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";

export const DigitalProductDocumentStatus = DigitalProductDocumentStatusDto;
export const DigitalProductDocumentStatusEnum = DigitalProductDocumentStatusDtoEnum;
export type DigitalProductDocumentStatusType = DigitalProductDocumentStatusDtoType;
export const DigitalProductDocumentStatusChangeSchema = DigitalProductDocumentStatusChangeDtoSchema;

export interface IDigitalProductDocumentStatusChangeable {
  publish: () => void;
  archive: () => void;
  restore: () => void;
  isDraft: () => boolean;
  isPublished: () => boolean;
  isArchived: () => boolean;
}

export function publishDpp(lastStatusChange: DigitalProductDocumentStatusChange) {
  if (lastStatusChange.currentStatus !== DigitalProductDocumentStatus.Draft) {
    throw new ValueError("Only drafts can be published.");
  }
  return DigitalProductDocumentStatusChange.create({
    previousStatus: lastStatusChange.currentStatus,
    currentStatus: DigitalProductDocumentStatus.Published,
  });
}

export function archiveDpp(lastStatusChange: DigitalProductDocumentStatusChange) {
  if (lastStatusChange.currentStatus === DigitalProductDocumentStatus.Archived) {
    throw new ValueError("A dpp can only be archived once.");
  }
  return DigitalProductDocumentStatusChange.create({
    previousStatus: lastStatusChange.currentStatus,
    currentStatus: DigitalProductDocumentStatus.Archived,
  });
}

export function restoreDpp(lastStatusChange: DigitalProductDocumentStatusChange) {
  if (lastStatusChange.previousStatus === null) {
    throw new ValueError("No previous status to restore from.");
  }
  if (lastStatusChange.previousStatus === DigitalProductDocumentStatus.Archived) {
    throw new ValueError("Cannot restore to the archived status.");
  }
  if (lastStatusChange.currentStatus !== DigitalProductDocumentStatus.Archived) {
    throw new ValueError("Only archived dpps can be restored.");
  }
  return DigitalProductDocumentStatusChange.create({
    previousStatus: lastStatusChange.currentStatus,
    currentStatus: lastStatusChange.previousStatus,
  });
}

export function handleDppStatusChangeRequest<T extends IDigitalProductDocumentStatusChangeable>(
  changeable: T,
  body: DigitalProductDocumentStatusModificationDto,
): void {
  switch (body.method) {
    case "Publish":
      changeable.publish();
      break;
    case "Archive":
      changeable.archive();
      break;
    case "Restore":
      changeable.restore();
      break;
    default: {
      const exhaustiveCheck: never = body.method;
      throw new ValueError(`Invalid status modification method: ${String(exhaustiveCheck)}`);
    }
  }
}

export class DigitalProductDocumentStatusChange {
  private constructor(
    public readonly previousStatus: DigitalProductDocumentStatusType | null,
    public readonly currentStatus: DigitalProductDocumentStatusType,
  ) {}

  static create(data: {
    previousStatus?: DigitalProductDocumentStatusType;
    currentStatus?: DigitalProductDocumentStatusType;
  }) {
    return new DigitalProductDocumentStatusChange(
      data.previousStatus ?? null,
      data.currentStatus ?? DigitalProductDocumentStatus.Draft,
    );
  }

  static fromPlain(data: unknown) {
    const parsed = DigitalProductDocumentStatusChangeSchema.parse(data);
    return new DigitalProductDocumentStatusChange(
      parsed.previousStatus ?? null,
      parsed.currentStatus,
    );
  }

  toPlain() {
    return {
      previousStatus: this.previousStatus,
      currentStatus: this.currentStatus,
    };
  }
}
