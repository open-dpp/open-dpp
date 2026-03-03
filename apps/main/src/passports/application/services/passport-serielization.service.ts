import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ValueError } from "@open-dpp/exception";
import { ExpandedEnvironment } from "../../../aas/domain/expanded-environment";
import { AasExportable } from "../../../aas/domain/exportable/aas-exportable";
import { EnvironmentService } from "../../../aas/presentation/environment.service";
import { Passport } from "../../domain/passport";
import { PassportRepository } from "../../infrastructure/passport.repository";

@Injectable()
export class PassportService {
  private readonly logger = new Logger(PassportService.name);

  constructor(
    private readonly passportRepository: PassportRepository,
    private readonly environmentService: EnvironmentService,
  ) { }

  async getProductPassport(passportId: string) {
    this.logger.log(`getProductPassport called with id: ${passportId}`);

    const passport = await this.passportRepository.findOne(passportId);
    if (!passport) {
      throw new NotFoundException(`Product passport with id ${passportId} not found`);
    }

    if (!passport.environment) {
      this.logger.warn(`Passport ${passportId} has no environment; returning empty shells and submodels`);
      return {
        ...passport.toPlain(),
        environment: ExpandedEnvironment.empty().toPlain(),
      };
    }

    const expandedEnv = await this.environmentService.loadExpandedEnvironment(passport.environment);

    return {
      ...passport.toPlain(),
      environment: expandedEnv.toPlain(),
    };
  }

  async exportPassport(passportId: string): Promise<AasExportable> {
    const passport = await this.passportRepository.findOneOrFail(passportId);
    const expandedEnvironment = await this.environmentService.loadExpandedEnvironment(passport.environment);
    const aasExportable = AasExportable.createFromPassport(passport, expandedEnvironment);
    return aasExportable.toExportPlain();
  }

  async importPassport(data: {
    organizationId: string;
    templateId?: string | null;
    environment: unknown;
    createdAt?: Date;
    updatedAt?: Date;
  }): Promise<Passport> {
    if (!data.organizationId) {
      throw new BadRequestException("organizationId is required");
    }

    let result: ReturnType<typeof Passport.importFromPlain>;
    try {
      result = Passport.importFromPlain(data as ImportPassportPlain, data.organizationId);
    }
    catch (err) {
      if (err instanceof ValueError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }

    const { entity, shells, submodels } = result;

    await this.environmentService.persistImportedEnvironment(
      shells,
      submodels,
      async (options) => { await this.passportRepository.save(entity, options); },
    );

    return entity;
  }
}
