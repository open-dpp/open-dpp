import { ValueError } from "@open-dpp/exception";
import { z } from "zod";

export const DppStatus = {
  Draft: "Draft",
  Published: "Published",
  Archived: "Archived",
} as const;

export const DppStatusEnum = z.enum(DppStatus);
export type DppStatusType = z.infer<typeof DppStatusEnum>;

export interface IDppStatusChangeable {
  publish: () => void;
  archive: () => void;
  restore: () => void;
  isDraft: () => boolean;
  isPublished: () => boolean;
  isArchived: () => boolean;
}

export const DppStatusChangeSchema = z.object({
  previousStatus: DppStatusEnum.nullish(),
  currentStatus: DppStatusEnum,
});

export function publishDpp(lastDppStatusChange: DppStatusChange) {
  if (lastDppStatusChange.currentStatus !== DppStatus.Draft) {
    throw new ValueError("Only drafts can be published.");
  }
  return DppStatusChange.create({
    previousStatus: lastDppStatusChange.currentStatus,
    currentStatus: DppStatus.Published,
  });
}

export function archiveDpp(lastDppStatusChange: DppStatusChange) {
  if (lastDppStatusChange.currentStatus === DppStatus.Archived) {
    throw new ValueError("A dpp can only archived once.");
  }
  return DppStatusChange.create({
    previousStatus: lastDppStatusChange.currentStatus,
    currentStatus: DppStatus.Archived,
  });
}

export function restoreDpp(lastDppStatusChange: DppStatusChange) {
  if (lastDppStatusChange.previousStatus === null) {
    throw new ValueError("No previous status to restore from.");
  }
  if (lastDppStatusChange.previousStatus === DppStatus.Archived) {
    throw new ValueError("Cannot restore to the archived status.");
  }
  if (lastDppStatusChange.currentStatus !== DppStatus.Archived) {
    throw new ValueError("Only archived dpps can be restored.");
  }
  return DppStatusChange.create({
    previousStatus: lastDppStatusChange.currentStatus,
    currentStatus: lastDppStatusChange.previousStatus,
  });
}

export class DppStatusChange {
  private constructor(
    public readonly previousStatus: DppStatusType | null,
    public readonly currentStatus: DppStatusType,
  ) {}

  static create(data: { previousStatus?: DppStatusType; currentStatus?: DppStatusType }) {
    return new DppStatusChange(data.previousStatus ?? null, data.currentStatus ?? DppStatus.Draft);
  }

  static fromPlain(data: unknown) {
    const parsed = DppStatusChangeSchema.parse(data);
    return new DppStatusChange(parsed.previousStatus ?? null, parsed.currentStatus);
  }

  toPlain() {
    return {
      previousStatus: this.previousStatus,
      currentStatus: this.currentStatus,
    };
  }
}
