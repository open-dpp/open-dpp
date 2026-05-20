import { ActivityHeader } from "../activity";
import { AdministrativeInformation } from "../../aas/domain/common/administrative-information";
import { z } from "zod";
import { compare } from "fast-json-patch/commonjs/duplex";

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
  return JsonPatchOperationSchema.array().parse(compare(oldData, newData));
}

export interface ActivityCreatePropsWithAdministration extends ActivityCreateProps {
  administration: AdministrativeInformation;
}

export function createActivityHeader(
  type: string,
  data: ActivityHeaderCreateProps,
  version: string,
) {
  return ActivityHeader.create({
    type,
    version: version,
    aggregateId: data.digitalProductDocumentId,
    userId: data.userId,
    createdAt: data.createdAt,
  });
}

export const OperationTypes = {
  Add: "add",
  Remove: "remove",
  Replace: "replace",
  Move: "move",
  Copy: "copy",
  Test: "test",
} as const;
export const OperationTypeEnum = z.enum(OperationTypes);
export type OperationTypesType = z.infer<typeof OperationTypeEnum>;

// Base schema JsonPatch operation specified by RFC 6902 from the IETF (https://jsonpatch.com/)
export const JsonPatchOperationSchema = z.object({
  op: OperationTypeEnum,
  path: z.string(),
  // "from" is only required for move/copy
  from: z.string().optional(),

  // value is optional depending on op
  value: z.any().optional(),
});
export type JsonPatchOperation = z.infer<typeof JsonPatchOperationSchema>;

// Extended JsonPatch operation with the dpp field which contains relevant dpp identifiers like the idShortPath
export const ExtendedJsonPatchOperationSchema = JsonPatchOperationSchema.extend({
  dpp: z.string(),
});
export type ExtendedJsonPatchOperation = z.infer<typeof ExtendedJsonPatchOperationSchema>;
