import { ActivityHeader } from "./activity";

export interface SharedActivityCreateProps {
  digitalProductDocumentId: string;
  userId?: string;
  createdAt?: Date;
  correlationId: string;
}

export function createActivityHeader(
  type: string,
  data: SharedActivityCreateProps,
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
