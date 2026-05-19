import { ActivityHeader } from "../activity";
import { AdministrativeInformation } from "../../aas/domain/common/administrative-information";
import { z } from "zod";
import { AdministrativeInformationJsonSchema } from "@open-dpp/dto";
import { compare } from "fast-json-patch/module/duplex";

const Version = {
  v1_0_0: "1.0.0",
} as const;

export interface ActivityHeaderCreateProps {
  digitalProductDocumentId: string;
  userId?: string;
  createdAt?: Date;
}

export interface ActivityCreateProps extends ActivityHeaderCreateProps {
  oldData: object | any[];
  newData: object | any[];
}

export function diff(oldData: object | any[], newData: object | any[]): JsonPatchOperation[] {
  return OperationSchema.array().parse(compare(oldData, newData));
}

export interface ActivityCreatePropsWithAdministration extends ActivityCreateProps {
  administration: AdministrativeInformation;
}

export function createActivityHeader(
  type: string,
  data: ActivityHeaderCreateProps,
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

export interface ActivityPayloadCreateProps {
  administration: AdministrativeInformation;
  changes: JsonPatchOperation[]; // JSON Patch is specified in RFC 6902 from the IETF (https://jsonpatch.com/)
}

// Allowed operation types in RFC 6902
const OperationType = z.enum(["add", "remove", "replace", "move", "copy", "test"]);

// Base schema
export const OperationSchema = z.object({
  op: OperationType,
  path: z.string(),
  // "from" is only required for move/copy
  from: z.string().optional(),

  // value is optional depending on op
  value: z.any().optional(),
});
export type JsonPatchOperation = z.infer<typeof OperationSchema>;

export const OperationWithAasSchema = OperationSchema.extend({ aas: z.string() });
export type JsonPatchOperationWithAas = z.infer<typeof OperationWithAasSchema>;

export const ActivityPayloadSchema = z.object({
  administration: AdministrativeInformationJsonSchema,
  changes: OperationSchema.array(),
});
