import type { Connection } from "mongoose";
import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Environment } from "../../../aas/domain/environment";
import { ExpandedEnvironment } from "../../../aas/domain/expanded-environment";
import { AasExportable } from "../../../aas/domain/exportable/aas-exportable";
import { SubjectAttributes } from "../../../aas/domain/security/subject-attributes";
import { EnvironmentService } from "../../../aas/presentation/environment.service";
import {
  UniqueProductIdentifierRepository,
} from "../../../unique-product-identifier/infrastructure/unique-product-identifier.repository";
import { Passport } from "../../domain/passport";
import { PassportRepository } from "../../infrastructure/passport.repository";

@Injectable()
export class PassportService {
  private readonly logger = new Logger(PassportService.name);

  constructor(
    private readonly passportRepository: PassportRepository,
    private readonly environmentService: EnvironmentService,
    @InjectConnection() private connection: Connection,
    private readonly uniqueProductIdentifierRepository: UniqueProductIdentifierRepository,
  ) {}

  async getExpandedProductPassport(passportId: string): Promise<AasExportable> {
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

      return AasExportable.createFromPassport(passport, ExpandedEnvironment.fromEnvironment(Environment.create({}), new Map(), new Map(), new Map()));
    }

    const expandedEnvironment = await this.environmentService.loadExpandedEnvironment(passport.environment);

    return AasExportable.createFromPassport(passport, expandedEnvironment);
  }

  async deletePassport(id: string, organizationId: string, subject: SubjectAttributes) {
    const passport = await this.loadPassportAndCheckOwnership(id, subject, organizationId);

    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        await this.environmentService.deleteEnvironment(passport.environment, session);
        await this.passportRepository.deleteById(passport.id, { session });
        await this.uniqueProductIdentifierRepository.deleteByReferenceId(passport.id, { session });
      });
    }
    finally {
      await session.endSession();
    }
  }

  public async loadPassportAndCheckOwnership(id: string, subject: SubjectAttributes, organizationId: string): Promise<Passport> {
    const passport = await this.passportRepository.findOneOrFail(id);
    if (passport.getOrganizationId() !== organizationId || subject.memberRole === undefined) {
      throw new ForbiddenException();
    }
    return passport;
  }
}
