import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Environment } from "../../../aas/domain/environment";
import { ExpandedEnvironment } from "../../../aas/domain/expanded-environment";
import { AasExportable } from "../../../aas/domain/exportable/aas-exportable";
import { EnvironmentService } from "../../../aas/presentation/environment.service";
import { PresentationConfigurationService } from "../../../presentation-configurations/application/services/presentation-configuration.service";
import { PassportRepository } from "../../infrastructure/passport.repository";

@Injectable()
export class PassportService {
  private readonly logger = new Logger(PassportService.name);

  constructor(
    private readonly passportRepository: PassportRepository,
    private readonly environmentService: EnvironmentService,
    private readonly presentationConfigurationService: PresentationConfigurationService,
  ) {}

  async getExpandedProductPassport(passportId: string): Promise<AasExportable> {
    const passport = await this.passportRepository.findOne(passportId);
    if (!passport) {
      throw new NotFoundException(`Product passport with id ${passportId} not found`);
    }
    const presentationConfiguration =
      await this.presentationConfigurationService.getOrCreateForPassport(passport);

    if (!passport.environment) {
      this.logger.warn(
        `Passport ${passportId} has no environment; returning empty shells and submodels`,
      );

      return AasExportable.createFromPassport(
        passport,
        ExpandedEnvironment.fromEnvironment(
          Environment.create({}),
          new Map(),
          new Map(),
          new Map(),
        ),
        presentationConfiguration,
      );
    }

    const expandedEnvironment = await this.environmentService.loadExpandedEnvironment(
      passport.environment,
    );

    return AasExportable.createFromPassport(
      passport,
      expandedEnvironment,
      presentationConfiguration,
    );
  }
}
