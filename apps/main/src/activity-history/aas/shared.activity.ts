import { ActivityHeader } from "../activity";
import { AdministrativeInformation } from "../../aas/domain/common/administrative-information";
import { IChange, Operation } from "json-diff-ts";
import { z } from "zod";
import { AdministrativeInformationJsonSchema } from "@open-dpp/dto";

export interface SharedActivityCreateProps {
  digitalProductDocumentId: string;
  userId?: string;
  createdAt?: Date;
}

const Version = {
  v1_0_0: "1.0.0",
} as const;

export function createActivityHeaderOld(
  type: string,
  data: SharedActivityCreateProps,
  version?: string,
) {
  return ActivityHeader.create({
    type,
    version: version ?? Version.v1_0_0,
    aggregateId: data.digitalProductDocumentId,
    userId: data.userId,
    createdAt: data.createdAt,
  });
}

export interface ActivityCreateProps {
  digitalProductDocumentId: string;
  oldData?: unknown;
  newData: unknown;
  userId?: string;
  createdAt?: Date;
}

export interface ActivityCreatePropsWithAdministration extends ActivityCreateProps {
  administration: AdministrativeInformation;
}

export function createActivityHeader(type: string, data: ActivityCreateProps, version?: string) {
  return ActivityHeader.create({
    type,
    version: version ?? Version.v1_0_0,
    aggregateId: data.digitalProductDocumentId,
    userId: data.userId,
    createdAt: data.createdAt,
  });
}

export interface ActivityPayloadCreateProps {
  administration: AdministrativeInformation;
  changes: IChange[];
}

export const ActivityChangeSchema = z.object({
  type: z.enum(Operation),
  key: z.string(),
  embeddedKey: z.string().optional(),
  /** When true, embeddedKey is a dot-separated nested path (e.g. "a.b" → @.a.b). */
  embeddedKeyIsPath: z.boolean().optional(),
  value: z.any().optional(),
  oldValue: z.any().optional(),
  get changes() {
    return ActivityChangeSchema.array().optional();
  },
});

export const ActivityPayloadSchema = z.object({
  administration: AdministrativeInformationJsonSchema,
  changes: ActivityChangeSchema.array(),
});

export function payloadToPlain(payload: ActivityPayloadCreateProps) {
  return {
    administration: payload.administration.toPlain(),
    changes: payload.changes,
  };
}
