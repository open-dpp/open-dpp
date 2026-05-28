import { ActivityHeader } from "./activity";
import { z } from "zod";

export interface ActivityHeaderCreateProps {
  digitalProductDocumentId: string;
  userId?: string;
  createdAt?: Date;
  correlationId: string;
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
    correlationId: data.correlationId,
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
