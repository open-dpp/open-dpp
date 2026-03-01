import { randomUUID } from "node:crypto";
import { AssetKind, KeyTypes, ReferenceTypes } from "@open-dpp/dto";
import { AssetAdministrationShell } from "./asset-adminstration-shell";
import { AssetInformation } from "./asset-information";
import { AdministrativeInformation } from "./common/administrative-information";
import { Key } from "./common/key";
import { LanguageText } from "./common/language-text";
import { Reference } from "./common/reference";
import { Submodel } from "./submodel-base/submodel";

describe("assetAdministrationShell", () => {
  it("should create a new asset administration shell", () => {
    const aas = AssetAdministrationShell.create({
      assetInformation: AssetInformation.create({ assetKind: AssetKind.Instance }),
    });
    expect(aas.assetInformation.assetKind).toEqual(AssetKind.Instance);
    expect(aas.administration).toEqual(AdministrativeInformation.create({ version: "1", revision: "0" }));
  });

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

  it("should be modified", () => {
    const aas = AssetAdministrationShell.create({
      assetInformation: AssetInformation.create({ assetKind: "Instance" }),
    });
    const displayName = [{ language: "en", text: "MyAAS" }];
    const description = [{ language: "en", text: "My description" }];
    aas.modify({ displayName, description });
    expect(aas.displayName).toEqual(displayName.map(LanguageText.fromPlain));
    expect(aas.description).toEqual(description.map(LanguageText.fromPlain));
  });

  it("should be able to be copied", () => {
    const id = "aasId";
    const aas = AssetAdministrationShell.create({
      id,
      assetInformation: AssetInformation.create({ assetKind: "Instance", globalAssetId: id }),
    });

    const submodel = Submodel.create({
      id: randomUUID(),
      idShort: "MySubmodel",
    });

    aas.addSubmodel(submodel);

    const submodelCopy = submodel.copy();

    const copy = aas.copy([submodelCopy]);

    expect(copy.id).not.toEqual(aas.id);
    expect(copy.assetInformation).toEqual({ ...aas.assetInformation, globalAssetId: copy.id });
    expect(copy.submodels).toEqual([
      Reference.create({
        type: ReferenceTypes.ModelReference,
        keys: [Key.create({
          type: KeyTypes.Submodel,
          value: submodelCopy.id,
        })],
      }),
    ]);
  });

  it("should add a submodel", () => {
    const aas = AssetAdministrationShell.create({
      assetInformation: AssetInformation.create({ assetKind: "Instance" }),
    });

    const submodel = Submodel.create({
      id: randomUUID(),
      idShort: "MySubmodel",
    });

    aas.addSubmodel(submodel);

    expect(aas.submodels).toEqual([Reference.create({
      type: ReferenceTypes.ModelReference,
      keys: [Key.create({
        type: KeyTypes.Submodel,
        value: submodel.id,
      })],
    })]);
  });
});
