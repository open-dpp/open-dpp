import { AssetAdministrationShell } from "./asset-adminstration-shell";
import { ConceptDescription } from "./concept-description";
import { Submodel } from "./submodel-base/submodel";

export class Environment {
  private constructor(
    public readonly assetAdministrationShells: Array<AssetAdministrationShell>,
    public readonly submodels: Array<Submodel>,
    public readonly conceptDescriptions: Array<ConceptDescription>,
  ) {

  }

  static create(data: {
    assetAdministrationShells?: Array<AssetAdministrationShell>;
    submodels?: Array<Submodel>;
    conceptDescriptions?: Array<ConceptDescription>;
  }): Environment {
    return new Environment(
      data.assetAdministrationShells ?? [],
      data.submodels ?? [],
      data.conceptDescriptions ?? [],
    );
  }

  addAssetAdministrationShell(assetAdministrationShell: AssetAdministrationShell) {
    this.assetAdministrationShells.push(assetAdministrationShell);
  }

  addSubmodel(submodel: Submodel) {
    this.submodels.push(submodel);
  }
}
