import { expect } from "@jest/globals";
import { AssetKind } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { AssetAdministrationShell } from "./asset-adminstration-shell";
import { AssetInformation } from "./asset-information";
import { AdministrativeInformation } from "./common/administrative-information";
import { Environment } from "./environment";
import { Submodel } from "./submodel-base/submodel";

describe("environment", () => {
  it("should add empty aas", () => {
    const environment = Environment.create({ });
    const aas = environment.addAssetAdministrationShell({ assetKind: AssetKind.Type });
    expect(environment.assetAdministrationShells).toEqual([aas.id]);
    expect(aas).toEqual(AssetAdministrationShell.create({
      id: aas.id,
      administration: AdministrativeInformation.create({ version: "1", revision: "0" }),
      assetInformation: AssetInformation.create({
        assetKind: AssetKind.Type,
        globalAssetId: aas.id,
      }),
    }));
  });

  it("should add empty submodel", () => {
    const environment = Environment.create({ });
    const id = "sub1";
    const newSubmodel = Submodel.create({ id, idShort: id });
    const submodel = environment.addSubmodel(newSubmodel);
    expect(environment.submodels).toEqual([submodel.id]);
    expect(submodel).toEqual(newSubmodel);
    expect(() => environment.addSubmodel(newSubmodel)).toThrow(new ValueError(`Submodel with id sub1 already exists`));
  });

  it("should delete submodel", () => {
    const environment = Environment.create({ });
    const id = "sub1";
    const submodelToDelete = Submodel.create({ id, idShort: id });
    const otherSubmodel = Submodel.create({ id: "sub2", idShort: "sub2" });
    environment.addSubmodel(submodelToDelete);
    environment.addSubmodel(otherSubmodel);
    expect(environment.submodels).toEqual([submodelToDelete.id, otherSubmodel.id]);
    environment.deleteSubmodel(submodelToDelete);
    expect(environment.submodels).toEqual([otherSubmodel.id]);
  });
});
