import { type ActivityDto, ActivityDtoTypes } from "@open-dpp/dto";
import { randomUUID } from "node:crypto";
import { Factory } from "fishery";

export const activitiesPlainFactory = Factory.define<ActivityDto>(() => ({
  header: {
    id: randomUUID(),
    aggregateId: randomUUID(),
    correlationId: randomUUID(),
    createdAt: new Date(),
    type: ActivityDtoTypes.SubmodelElementModification,
    userId: randomUUID(),
    version: "1.0.0",
  },
  payload: {
    submodelId: randomUUID(),
    fullIdShortPath: "some-path",
    data: { idShort: "some-id-short", value: "some-value" },
  },
}));
