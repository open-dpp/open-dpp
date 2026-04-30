import {
  SubmodelElementModificationActivity,
  SubmodelElementModificationActivityPayload,
} from "./submodel-element-modification.activity";
import { IdShortPath } from "../../aas/domain/common/id-short-path";

describe("SubmodelElementModificationEvent", () => {
  it("should return database representation", () => {
    const submodelId = "submodelId";
    const event = SubmodelElementModificationActivity.create({
      digitalProductDocumentId: submodelId,
      payload: SubmodelElementModificationActivityPayload.create({
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
