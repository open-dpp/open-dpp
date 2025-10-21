import { AssetAdministrationShell } from "./asset-adminstration-shell";
import { ConceptDescription } from "./concept-description";
import { Submodel } from "./submodelBase/submodel";

export class Environment {
  private constructor(
    public readonly assetAdministrationShells: Array<AssetAdministrationShell> | null = null,
    public readonly submodels: Array<Submodel> | null = null,
    public readonly conceptDescriptions: Array<ConceptDescription> | null = null,
  ) {

  }

  static create(data: {
    assetAdministrationShells?: Array<AssetAdministrationShell>;
    submodels?: Array<Submodel>;
    conceptDescriptions?: Array<ConceptDescription>;
  }): Environment {
    return new Environment(
      data.assetAdministrationShells ?? null,
      data.submodels ?? null,
      data.conceptDescriptions ?? null,
    );
  }
}
