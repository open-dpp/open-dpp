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

    if (!passport.environment) {
      this.logger.warn(`Passport ${passportId} has no environment; returning empty shells and submodels`);
      return {
        ...passport,
        environment: {
          assetAdministrationShells: [],
          submodels: [],
        },
      };
    }

    const shellIds = passport.environment.assetAdministrationShells ?? [];
    const submodelIds = passport.environment.submodels ?? [];

    const [shellResults, submodelResults] = await Promise.all([
      Promise.all(
        shellIds.map(shellId => this.aasRepository.findOne(shellId)),
      ),
      Promise.all(
        submodelIds.map(submodelId => this.submodelRepository.findOne(submodelId)),
      ),
    ]);

    const shells: Array<AssetAdministrationShell> = [];
    shellResults.forEach((aas, index) => {
      if (aas) {
        shells.push(aas);
      }
      else {
        this.logger.warn(`Asset administration shell not found for id: ${shellIds[index]} (passport ${passportId})`);
      }
    });

    const submodels: Array<Submodel> = [];
    submodelResults.forEach((submodel, index) => {
      if (submodel) {
        submodels.push(submodel);
      }
      else {
        this.logger.warn(`Submodel not found for id: ${submodelIds[index]} (passport ${passportId})`);
      }
    });

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
