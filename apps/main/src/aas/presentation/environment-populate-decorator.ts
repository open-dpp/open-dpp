import { AssetAdministrationShell } from "../domain/asset-adminstration-shell";
import { IConvertableToPlain } from "../domain/convertable-to-plain";
import { Environment } from "../domain/environment";
import { Submodel } from "../domain/submodel-base/submodel";
import { AasRepository } from "../infrastructure/aas.repository";
import { SubmodelRepository } from "../infrastructure/submodel.repository";

export interface PopulateOptions { assetAdministrationShells?: boolean; submodels?: boolean; ignoreMissing?: boolean }
export class EnvironmentPopulateDecorator implements IConvertableToPlain {
  private assetAdministrationShells: AssetAdministrationShell[] | undefined;
  private submodels: Submodel[] | undefined;

  constructor(
    private environment: Environment,
    private aasRepository: AasRepository,
    private submodelRepository: SubmodelRepository,
  ) {}

  async populate(options: PopulateOptions) {
    if (options.assetAdministrationShells) {
      await this.populateAssetAdministrationShells(options.ignoreMissing);
    }
    if (options.submodels) {
      await this.populateSubmodels();
    }
    return this;
  }

  private async populateAssetAdministrationShells(ignoreMissing?: boolean) {
    if (ignoreMissing) {
      this.assetAdministrationShells = (await Promise.all(
        this.environment.assetAdministrationShells.map(async (aasId) => {
          return await this.aasRepository.findOne(aasId);
        }),
      )).filter(aas => aas !== undefined);
    }
    else {
      this.assetAdministrationShells = await Promise.all(
        this.environment.assetAdministrationShells.map(async aasId => this.aasRepository.findOneOrFail(aasId)),
      );
    }
  }

  private async populateSubmodels(ignoreMissing?: boolean) {
    if (ignoreMissing) {
      this.submodels = (await Promise.all(
        this.environment.submodels.map(async (submodelId) => {
          return await this.submodelRepository.findOne(submodelId);
        }),
      )).filter(submodel => submodel !== undefined);
    }
    else {
      this.submodels = await Promise.all(
        this.environment.submodels.map(async submodelId => this.submodelRepository.findOneOrFail(submodelId)),
      );
    }
  }

  toPlain(): Record<string, any> {
    return {
      ...this.environment.toPlain(),
      ...(this.assetAdministrationShells
        ? {
            assetAdministrationShells: this.assetAdministrationShells.map(aas => aas.toPlain()),
          }
        : {}),
      ...(this.submodels
        ? {
            submodels: this.submodels.map(submodel => submodel.toPlain()),
          }
        : {}),
    };
  }
}
