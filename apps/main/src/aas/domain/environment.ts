import { AssetAdministrationShell } from "./asset-adminstration-shell";
import { EnvironmentJsonSchema } from "./parsing/environment-json-schema";
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

  addAssetAdministrationShell(assetAdministrationShell: AssetAdministrationShell) {
    this.assetAdministrationShells.push(assetAdministrationShell.id);
  }

  addSubmodel(submodel: Submodel) {
    this.submodels.push(submodel.id);
  }

  toPlain() {
    return {
      assetAdministrationShells: this.assetAdministrationShells,
      submodels: this.submodels,
      conceptDescriptions: this.conceptDescriptions,
    };
  }
}
