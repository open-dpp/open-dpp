import { AssetKind, KeyTypes, ReferenceTypes } from "@open-dpp/dto";
import { AssetAdministrationShell } from "./asset-adminstration-shell";
import { AssetInformation } from "./asset-information";
import { Key } from "./common/key";
import { Reference } from "./common/reference";
import { Submodel } from "./submodel-base/submodel";

describe("assetAdministrationShell", () => {
  it("should delete submodel", () => {
    const submodelId1 = "submodelId1";
    const submodelToDelete = Submodel.create({ id: submodelId1, idShort: "subD" });

    const submodelRef1 = Reference.create({
      type: ReferenceTypes.ModelReference,
      keys: [Key.create({ type: KeyTypes.Submodel, value: submodelId1 })],
    });
    const submodelId2 = "submodelId2";
    const submodelRef2 = Reference.create({
      type: ReferenceTypes.ModelReference,
      keys: [Key.create({ type: KeyTypes.Submodel, value: submodelId2 })],
    });

    const aas = AssetAdministrationShell.create({
      assetInformation: AssetInformation.create({ assetKind: AssetKind.Instance }),
      submodels: [submodelRef1, submodelRef2],
    });
    aas.deleteSubmodel(submodelToDelete);
    expect(aas.submodels).toEqual([submodelRef2]);
  });
});
