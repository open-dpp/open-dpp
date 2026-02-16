import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { AssetAdministrationShell } from "../../../aas/domain/asset-adminstration-shell";
import { Submodel } from "../../../aas/domain/submodel-base/submodel";
import { AasRepository } from "../../../aas/infrastructure/aas.repository";
import { SubmodelRepository } from "../../../aas/infrastructure/submodel.repository";
import { PassportRepository } from "../../infrastructure/passport.repository";

@Injectable()
export class PassportService {
  private readonly logger = new Logger(PassportService.name);

  constructor(
    private readonly passportRepository: PassportRepository,
    // private readonly organizationsService: OrganizationsService,
    private readonly aasRepository: AasRepository,
    private readonly submodelRepository: SubmodelRepository,
  ) { }

  // TODO: Add organization data after DDD rebuild branch merged
  async getProductPassport(passportId: string) {
    this.logger.log(`getProductPassport called with id: ${passportId}`);

    const passport = await this.passportRepository.findOne(passportId);
    if (!passport) {
      throw new NotFoundException(`Product passport with id ${passportId} not found`);
    }

    /* const organizationData = await this.organizationsService.getOrganizationDataForPermalink(passport.organizationId);

    if (!organizationData) {
      throw new NotFoundException(`Organization data for passport ${passportId} not found`);
    } */

    const shells: Array<AssetAdministrationShell> = [];
    for (const shellId of passport.environment.assetAdministrationShells) {
      const aas = await this.aasRepository.findOne(shellId);
      if (aas) {
        shells.push(aas);
      }
    }

    const submodels: Array<Submodel> = [];
    for (const submodelId of passport.environment.submodels) {
      const submodel = await this.submodelRepository.findOne(submodelId);
      if (submodel) {
        submodels.push(submodel);
      }
    }

    return {
      // organization: organizationData,
      ...passport,
      environment: {
        assetAdministrationShells: shells,
        submodels,
      },
    };
  }
}
