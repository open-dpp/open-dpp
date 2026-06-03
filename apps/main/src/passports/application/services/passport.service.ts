import type { Connection } from "mongoose";
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Environment } from "../../../aas/domain/environment";
import { ExpandedEnvironment } from "../../../aas/domain/expanded-environment";
import { AasExportable } from "../../../aas/domain/exportable/aas-exportable";
import { SubjectAttributes } from "../../../aas/domain/security/subject-attributes";
import { EnvironmentService, UserContext } from "../../../aas/presentation/environment.service";
import { PermalinkApplicationService } from "../../../permalink/application/services/permalink.application.service";
import { PermalinkRepository } from "../../../permalink/infrastructure/permalink.repository";
import { PresentationConfigurationService } from "../../../presentation-configurations/application/services/presentation-configuration.service";
import { PresentationConfigurationRepository } from "../../../presentation-configurations/infrastructure/presentation-configuration.repository";
import { UniqueProductIdentifierRepository } from "../../../unique-product-identifier/infrastructure/unique-product-identifier.repository";
import { Passport } from "../../domain/passport";
import { PassportRepository } from "../../infrastructure/passport.repository";
import {
  DigitalProductDocumentStatusModificationDto,
  PassportDtoSchema,
  PresentationReferenceType,
} from "@open-dpp/dto";
import { PresentationReferenceHolder } from "../../../presentation-configurations/application/services/presentation-configuration.service";
import { handleDppStatusChangeRequest } from "../../../digital-product-document/domain/digital-product-document-status";
import { DigitalProductDocumentService } from "../../../digital-product-document/application/digital-product-document.service";
import { ActivityRepository } from "../../../activity-history/infrastructure/activity.repository";
import { DbSessionOptions } from "../../../database/query-options";

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
    private readonly presentationConfigurationService: PresentationConfigurationService,
    private readonly presentationConfigurationRepository: PresentationConfigurationRepository,
    private readonly permalinkRepository: PermalinkRepository,
    private readonly permalinkApplicationService: PermalinkApplicationService,
  ) {
    this.digitalProductDocumentService = new DigitalProductDocumentService(
      this.environmentService,
      this.passportRepository,
      this.activityRepository,
      this.connection,
    );
  }

  async getExpandedProductPassport(passportId: string): Promise<AasExportable> {
    const passport = await this.passportRepository.findOne(passportId);
    if (!passport) {
      throw new NotFoundException(`Product passport with id ${passportId} not found`);
    }
    const presentationConfiguration = await this.presentationConfigurationService.getEffective(
      passportToHolder(passport),
    );

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

  async modifyPassportStatus(
    correlationId: string,
    organizationId: string,
    id: string,
    body: DigitalProductDocumentStatusModificationDto,
    userContext: UserContext,
  ) {
    const passport =
      await this.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
        id,
        subject,
        organizationId,
      );
    const updatedPassport = handleDppStatusChangeRequest(passport, body);
    const saved = await this.environmentService.withTransaction(async (options) => {
      const persisted = await this.passportRepository.save(updatedPassport, options);
      if (body.method === "Publish") {
        await this.permalinkApplicationService.freezeAllForPassport(persisted, options);
      }
      return persisted;
    });
    return PassportDtoSchema.parse(saved.toPlain());
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

        await this.permalinkRepository.deleteAllByPassportId(passport.id, { session });
        await this.presentationConfigurationRepository.deleteByReference(
          { referenceType: PresentationReferenceType.Passport, referenceId: passport.id },
          { session },
        );
      });
    } finally {
      await session.endSession();
    }
  }
}

function passportToHolder(passport: Passport): PresentationReferenceHolder {
  return {
    id: passport.id,
    organizationId: passport.organizationId,
    referenceType: PresentationReferenceType.Passport,
  };
}
