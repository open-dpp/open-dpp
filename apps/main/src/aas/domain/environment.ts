import { randomUUID } from "node:crypto";
import { AssetKindType, EnvironmentJsonSchema } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { AssetAdministrationShell } from "./asset-adminstration-shell";
import { AssetInformation } from "./asset-information";
import { AdministrativeInformation } from "./common/administrative-information";
import { Submodel } from "./submodel-base/submodel";

export class Environment {
  private constructor(
    public readonly assetAdministrationShells: Array<string>,
    public readonly submodels: Array<string>,
    public readonly conceptDescriptions: Array<string>,
  ) {

  }

  static create(data: {
    assetAdministrationShells?: Array<string>;
    submodels?: Array<string>;
    conceptDescriptions?: Array<string>;
  }): Environment {
    return new Environment(
      data.assetAdministrationShells ?? [],
      data.submodels ?? [],
      data.conceptDescriptions ?? [],
    );
  }

  static fromPlain(data: unknown): Environment {
    const parsed = EnvironmentJsonSchema.parse(data);
    return new Environment(
      parsed.assetAdministrationShells,
      parsed.submodels,
      parsed.conceptDescriptions,
    );
  }

  addAssetAdministrationShell(assetAdministrationShell: AssetAdministrationShell | { assetKind: AssetKindType }): AssetAdministrationShell {
    if (assetAdministrationShell instanceof AssetAdministrationShell) {
      this.assetAdministrationShells.push(assetAdministrationShell.id);
      return assetAdministrationShell;
    }
    const id = randomUUID();
    const newAas = AssetAdministrationShell.create({
      id,
      assetInformation: AssetInformation.create({ assetKind: assetAdministrationShell.assetKind, globalAssetId: id }),
      administration: AdministrativeInformation.create({ version: "1", revision: "0" }),
    });
    this.assetAdministrationShells.push(newAas.id);
    return newAas;
  }

  addSubmodel(submodel: Submodel) {
    if (this.submodels.includes(submodel.id)) {
      throw new ValueError(`Submodel with id ${submodel.id} already exists`);
    }
    this.submodels.push(submodel.id);
    return submodel;
  }

  toPlain() {
    return {
      assetAdministrationShells: this.assetAdministrationShells,
      submodels: this.submodels,
      conceptDescriptions: this.conceptDescriptions,
    };
  }
}
