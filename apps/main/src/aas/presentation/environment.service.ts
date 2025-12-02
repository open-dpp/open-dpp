import { ForbiddenException } from "@nestjs/common";
import { AssetAdministrationShell } from "../domain/asset-adminstration-shell";

import { Environment } from "../domain/environment";
import { Pagination } from "../domain/pagination";
import { AasRepository } from "../infrastructure/aas.repository";
import {
  IDigitalProductPassportIdentifiableRepository,
} from "../infrastructure/digital-product-passport-identifiable.repository";
import { PassportRepository } from "../infrastructure/passport.repository";
import { SubmodelRepository } from "../infrastructure/submodel.repository";

export class EnvironmentService {
  constructor(private readonly dppIdentifiableRepository: IDigitalProductPassportIdentifiableRepository, private readonly aasRepository: AasRepository, private readonly submodelRepository: SubmodelRepository) {
  }

  public environmentWrapperClass() {
    return this.dppIdentifiableRepository instanceof PassportRepository ? "passport" : "template";
  }

  private async loadEnvironmentOrFail(organizationId: string, environmentId: string): Promise<Environment> {
    const dppIdentifiable = await this.dppIdentifiableRepository.findOneOrFail(environmentId);
    if (!dppIdentifiable.ownedByOrganization(organizationId)) {
      throw new ForbiddenException();
    }
    return dppIdentifiable.getEnvironment();
  }

  async getAasShells(organizationId: string, environmentId: string, pagination: Pagination): Promise<AssetAdministrationShell[]> {
    const environment = await this.loadEnvironmentOrFail(organizationId, environmentId);
    const pages = pagination.nextPages(environment.assetAdministrationShells);
    return Promise.all(pages.map(p => this.aasRepository.findOneOrFail(p)));
  }
}
