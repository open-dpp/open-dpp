import { type ActivityDto, ActivityDtoTypes } from "@open-dpp/dto";
import { randomUUID } from "node:crypto";
import { Factory } from "fishery";

export const activitiesPlainFactory = Factory.define<ActivityDto>(() => ({
  header: {
    id: randomUUID(),
    aggregateId: randomUUID(),
    correlationId: randomUUID(),
    createdAt: new Date().toISOString(),
    type: ActivityDtoTypes.SubmodelActivity,
    userId: randomUUID(),
    version: "1.0.0",
    exportVersion: "1.0.0",
  },
  payload: {
    submodelId: randomUUID(),
    fullIdShortPath: "section1.list",
    additionalIdShort: "col1",
    administration: { version: "1", revision: "0" },
    operation: "SubmodelColumnDeleted",
    changes: [
      {
        op: "remove",
        path: "/submodelElements/0/value/0/value/0",
        dpp: `list.row1.col1`,
      },
    ],
  },
}));
