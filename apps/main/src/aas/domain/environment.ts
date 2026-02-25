import { EnvironmentJsonSchema } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { AssetAdministrationShell } from "./asset-adminstration-shell";
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

  addAssetAdministrationShell(assetAdministrationShell: AssetAdministrationShell): AssetAdministrationShell {
    if (this.assetAdministrationShells.includes(assetAdministrationShell.id)) {
      throw new ValueError(`AssetAdministrationShell with id ${assetAdministrationShell.id} already exists`);
    }
    this.assetAdministrationShells.push(assetAdministrationShell.id);
    return assetAdministrationShell;
  }

  addSubmodel(submodel: Submodel) {
    if (this.submodels.includes(submodel.id)) {
      throw new ValueError(`Submodel with id ${submodel.id} already exists`);
    }
    this.submodels.push(submodel.id);
    return submodel;
  }

  deleteSubmodel(submodel: Submodel) {
    const index = this.submodels.indexOf(submodel.id);
    if (index === -1) {
      throw new ValueError(`Submodel with id ${submodel.id} does not exist`);
    }
    this.submodels.splice(index, 1);
  }

  toPlain() {
    return {
      assetAdministrationShells: this.assetAdministrationShells,
      submodels: this.submodels,
      conceptDescriptions: this.conceptDescriptions,
    };
  }
}
