import { randomUUID } from "node:crypto";
import { KeyTypes, ReferenceTypes } from "@open-dpp/dto";
import { AssetAdministrationShell } from "./asset-adminstration-shell";
import { AssetInformation } from "./asset-information";
import { Key } from "./common/key";
import { Reference } from "./common/reference";
import { Submodel } from "./submodel-base/submodel";

describe("asset administration shell", () => {
  it("should be able to be copied", () => {
    const aas = AssetAdministrationShell.create({
      assetInformation: AssetInformation.create({ assetKind: "Instance" }),
    });

    const submodel = Submodel.create({
      id: randomUUID(),
      idShort: "MySubmodel",
    });

    aas.addSubmodel(submodel);

    const submodelCopy = submodel.copy();

    const copy = aas.copy([submodelCopy]);

    expect(copy.id).not.toEqual(aas.id);
    expect(copy.assetInformation).toEqual(aas.assetInformation);
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
