import type { Connection } from "mongoose";
import { ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Environment } from "../../../aas/domain/environment";
import { ExpandedEnvironment } from "../../../aas/domain/expanded-environment";
import { AasExportable } from "../../../aas/domain/exportable/aas-exportable";
import { SubjectAttributes } from "../../../aas/domain/security/subject-attributes";
import { EnvironmentService } from "../../../aas/presentation/environment.service";
import { UniqueProductIdentifierRepository } from "../../../unique-product-identifier/infrastructure/unique-product-identifier.repository";
import { Passport } from "../../domain/passport";
import { PassportRepository } from "../../infrastructure/passport.repository";
import { DigitalProductDocumentStatusModificationDto, PassportDtoSchema } from "@open-dpp/dto";
import { handleDppStatusChangeRequest } from "../../../digital-product-document/domain/digital-product-document-status";
import { DigitalProductDocumentService } from "../../../digital-product-document/application/digital-product-document.service";
import { ActivityRepository } from "../../../activity-history/infrastructure/activity.repository";

@Injectable()
export class PassportService {
  private readonly logger = new Logger(PassportService.name);
  public readonly digitalProductDocumentService: DigitalProductDocumentService<Passport>;
  constructor(
    private readonly passportRepository: PassportRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly environmentService: EnvironmentService,
    @InjectConnection() private connection: Connection,
    private readonly uniqueProductIdentifierRepository: UniqueProductIdentifierRepository,
  ) {
    this.digitalProductDocumentService = new DigitalProductDocumentService(
      this.environmentService,
      this.passportRepository,
      this.activityRepository,
    );
  }

  async getExpandedProductPassport(passportId: string): Promise<AasExportable> {
    const passport = await this.passportRepository.findOne(passportId);
    if (!passport) {
      throw new NotFoundException(`Product passport with id ${passportId} not found`);
    }

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
      );
    }

    const expandedEnvironment = await this.environmentService.loadExpandedEnvironment(
      passport.environment,
    );

    return AasExportable.createFromPassport(passport, expandedEnvironment);
  }

  async modifyPassportStatus(
    id: string,
    organizationId: string,
    subject: SubjectAttributes,
    body: DigitalProductDocumentStatusModificationDto,
  ) {
    const passport =
      await this.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
        id,
        subject,
        organizationId,
      );
    handleDppStatusChangeRequest(passport, body);
    return PassportDtoSchema.parse((await this.passportRepository.save(passport)).toPlain());
  }

  async deletePassport(id: string, organizationId: string, subject: SubjectAttributes) {
    const passport =
      await this.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
        id,
        subject,
        organizationId,
      );
    if (!passport.isDraft()) {
      throw new ForbiddenException('Only passports with the status "Draft" can be deleted');
    }

    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        await this.environmentService.deleteEnvironment(passport.getEnvironment(), session);
        await this.passportRepository.deleteById(passport.id, { session });
        await this.uniqueProductIdentifierRepository.deleteByReferenceId(passport.id, { session });
      });
    } finally {
      await session.endSession();
    }
  }
}
