import { ActivityHeader } from "../../activity";
import { SubmodelBaseModificationActivityPayload } from "./submodel-base-modification.payload";

export interface SubmodelActivityCreateProps {
  digitalProductDocumentId: string;
  payload: SubmodelBaseModificationActivityPayload;
  userId?: string;
  createdAt?: Date;
}

const Version = {
  v1_0_0: "1.0.0",
} as const;

export function createActivityHeader(
  type: string,
  data: SubmodelActivityCreateProps,
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
