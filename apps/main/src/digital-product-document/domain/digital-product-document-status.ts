import { ValueError } from "@open-dpp/exception";
import { z } from "zod";
import { BadRequestException } from "@nestjs/common";
import { DigitalProductDocumentStatusModificationDto } from "@open-dpp/dto";

export const DigitalProductDocumentStatus = {
  Draft: "Draft",
  Published: "Published",
  Archived: "Archived",
} as const;

export const DigitalProductDocumentStatusEnum = z.enum(DigitalProductDocumentStatus);
export type DigitalProductDocumentStatusType = z.infer<typeof DigitalProductDocumentStatusEnum>;

export interface IDigitalProductDocumentStatusChangeable {
  publish: () => void;
  archive: () => void;
  restore: () => void;
  isDraft: () => boolean;
  isPublished: () => boolean;
  isArchived: () => boolean;
}

export const DigitalProductDocumentStatusChangeSchema = z.object({
  previousStatus: DigitalProductDocumentStatusEnum.nullish(),
  currentStatus: DigitalProductDocumentStatusEnum,
});

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
    throw new ValueError("A dpp can only archived once.");
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

export function handleDppStatusChangeRequest(
  changeable: IDigitalProductDocumentStatusChangeable,
  body: DigitalProductDocumentStatusModificationDto,
) {
  if (body.method === "Publish") {
    changeable.publish();
  } else if (body.method === "Archive") {
    changeable.archive();
  } else if (body.method === "Restore") {
    changeable.restore();
  } else {
    throw new BadRequestException("Invalid method");
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
