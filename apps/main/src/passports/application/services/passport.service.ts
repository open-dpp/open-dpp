import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ValueError } from "@open-dpp/exception";
import { ExpandedEnvironment, ExpandedEnvironmentPlain } from "../../../aas/domain/expanded-environment";
import { EnvironmentService } from "../../../aas/presentation/environment.service";
import { Passport } from "../../domain/passport";
import { PassportRepository } from "../../infrastructure/passport.repository";

export type ExpandedPassportPlain = Omit<ReturnType<Passport["toPlain"]>, "environment"> & {
  environment: ExpandedEnvironmentPlain;
};

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

  async exportPassport(passportId: string): Promise<ExpandedPassportPlain> {
    const passport = await this.passportRepository.findOneOrFail(passportId);

    if (!passport.environment) {
      return {
        ...passport.toPlain(),
        environment: ExpandedEnvironment.empty().toPlain(),
      } as ExpandedPassportPlain;
    }

    const expandedEnv = await this.environmentService.loadExpandedEnvironment(passport.environment);

    return {
      ...passport.toPlain(),
      environment: expandedEnv.toPlain(),
    } as ExpandedPassportPlain;
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

    let expandedEnv: ExpandedEnvironment;
    try {
      expandedEnv = ExpandedEnvironment.fromPlain(data.environment);
    }
    catch (err) {
      if (err instanceof ValueError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }

    const { environment, shells, submodels } = expandedEnv.copyWithNewIds();

    const newPassport = Passport.create({
      organizationId: data.organizationId,
      templateId: data.templateId ?? undefined,
      environment,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });

    await this.environmentService.persistImportedEnvironment(
      shells,
      submodels,
      async (options) => { await this.passportRepository.save(newPassport, options); },
    );

    return newPassport;
  }
}
