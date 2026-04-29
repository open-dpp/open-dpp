import {
  SubmodelElementModificationEvent,
  SubmodelElementModificationEventPayload,
} from "./submodel-element-modification.event";
import { IdShortPath } from "../../aas/domain/common/id-short-path";

describe("SubmodelElementModificationEvent", () => {
  it("should return database representation", () => {
    const submodelId = "submodelId";
    const event = SubmodelElementModificationEvent.create({
      submodelId,
      payload: SubmodelElementModificationEventPayload.create({
        fullIdShortPath: IdShortPath.create({ path: `${submodelId}.prop1` }),
      }),
    });
    expect(event.toDatabase()).toEqual({
      _id: event.header.id,
      ...event.header,
      payload: {
        fullIdShortPath: `${submodelId}.prop1`,
      },
    });
  });
});
