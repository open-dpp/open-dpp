import { ActivityHeader } from "../activity";

export interface SharedActivityCreateProps {
  digitalProductDocumentId: string;
  userId?: string;
  createdAt?: Date;
}

const Version = {
  v1_0_0: "1.0.0",
} as const;

export function createActivityHeader(
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
