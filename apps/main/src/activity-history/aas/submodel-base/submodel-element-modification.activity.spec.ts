import { SubmodelElementModificationActivity } from "./submodel-element-modification.activity";
import { IdShortPath } from "../../../aas/domain/common/id-short-path";
import { SubmodelBaseModificationActivityPayload } from "./submodel-base-modification.payload";
import { AdministrativeInformation } from "../../../aas/domain/common/administrative-information";

describe("SubmodelElementModificationEvent", () => {
  it("should return database representation", () => {
    const submodelId = "submodelId";
    const event = SubmodelElementModificationActivity.create({
      digitalProductDocumentId: submodelId,
      payload: SubmodelBaseModificationActivityPayload.create({
        submodelId,
        fullIdShortPath: IdShortPath.create({ path: `${submodelId}.prop1` }),
        data: { idShort: "prop1", value: "20" },
        administration: AdministrativeInformation.create({ version: "1", revision: "0" }),
      }),
    });
    expect(event.toDatabase()).toEqual({
      _id: event.header.id,
      ...event.header,
      payload: {
        submodelId,
        fullIdShortPath: `${submodelId}.prop1`,
        data: { idShort: "prop1", value: "20" },
        administration: { version: "1", revision: "0" },
      },
    });
  });
});
