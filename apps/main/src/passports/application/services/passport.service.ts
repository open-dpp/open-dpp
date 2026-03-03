import {
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { AasExportable } from "../../../aas/domain/exportable/aas-exportable";
import { AasRepository } from "../../../aas/infrastructure/aas.repository";
import { SubmodelRepository } from "../../../aas/infrastructure/submodel.repository";
import {
  DigitalProductPassportIdentifiableEnvironmentPopulateDecorator,
} from "../../../aas/presentation/digital-product-passport-identifiable-environment-populate-decorator";
import { EnvironmentService } from "../../../aas/presentation/environment.service";
import { PassportRepository } from "../../infrastructure/passport.repository";

@Injectable()
export class PassportService {
  private readonly logger = new Logger(PassportService.name);

  constructor(
    private readonly passportRepository: PassportRepository,
    private readonly environmentService: EnvironmentService,
    private readonly aasRepository: AasRepository,
    private readonly submodelRepository: SubmodelRepository,
  ) {}

  async getExpandedProductPassport(passportId: string) {
    const passport = await this.passportRepository.findOne(passportId);
    if (!passport) {
      throw new NotFoundException(
        `Product passport with id ${passportId} not found`,
      );
    }

    if (!passport.environment) {
      this.logger.warn(
        `Passport ${passportId} has no environment; returning empty shells and submodels`,
      );
      return {
        ...passport.toPlain(),
        environment: {
          assetAdministrationShells: [],
          submodels: [],
          conceptDescriptions: [],
        },
      };
    }

    const extendEnvironmentDecorator = new DigitalProductPassportIdentifiableEnvironmentPopulateDecorator(passport, this.aasRepository, this.submodelRepository);
    await extendEnvironmentDecorator.populate({ assetAdministrationShells: true, submodels: true, ignoreMissing: true });
    // return extendEnvironmentDecorator.toPlain();

    const expandedEnvironment = await this.environmentService.loadExpandedEnvironment(passport.environment);
    return AasExportable.createFromPassport(passport, expandedEnvironment);
  }
}
