import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { EnvironmentService } from "../../../aas/presentation/environment.service";
import { PassportRepository } from "../../infrastructure/passport.repository";

@Injectable()
export class PassportService {
  private readonly logger = new Logger(PassportService.name);

  constructor(
    private readonly passportRepository: PassportRepository,
    // private readonly organizationsService: OrganizationsService,
    private readonly environmentService: EnvironmentService,
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
        ...passport.toPlain(),
        environment: {
          assetAdministrationShells: [],
          submodels: [],
          conceptDescriptions: [],
        },
      };
    }

    const environmentPlain = await this.environmentService.getFullEnvironmentAsPlain(passport.environment);

    return {
      // organization: organizationData,
      ...passport.toPlain(),
      environment: environmentPlain,
    };
  }
}
