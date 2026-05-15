import { ActivityHeader } from "../activity";
import { AdministrativeInformation } from "../../aas/domain/common/administrative-information";
import { z } from "zod";
import { AdministrativeInformationJsonSchema } from "@open-dpp/dto";
import { Operation } from "fast-json-patch/module/core";
import { compare } from "fast-json-patch/module/duplex";

const Version = {
  v1_0_0: "1.0.0",
} as const;

export interface ActivityCreateProps {
  digitalProductDocumentId: string;
  oldData?: object | any[];
  newData: object | any[];
  userId?: string;
  createdAt?: Date;
}

export function diff(oldData: object | any[] | undefined, newData: object | any[]): Operation[] {
  return compare(oldData ?? {}, newData);
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
  changes: Operation[]; // JSON Patch is specified in RFC 6902 from the IETF (https://jsonpatch.com/)
}

// Allowed operation types in RFC 6902
const OperationType = z.enum(["add", "remove", "replace", "move", "copy", "test"]);

// Base schema
export const OperationSchema: z.ZodType<Operation> = z.object({
  op: OperationType,
  path: z.string(),

  // "from" is only required for move/copy
  from: z.string().optional(),

  // value is optional depending on op
  value: z.any().optional(),
}) as z.ZodType<Operation>;

export const ActivityPayloadSchema = z.object({
  administration: AdministrativeInformationJsonSchema,
  changes: OperationSchema.array(),
});

export function payloadToPlain(payload: ActivityPayloadCreateProps) {
  return {
    administration: payload.administration.toPlain(),
    changes: payload.changes,
  };
}
