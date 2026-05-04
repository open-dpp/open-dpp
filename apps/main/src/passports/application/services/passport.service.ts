import type { Connection } from "mongoose";
import { ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Environment } from "../../../aas/domain/environment";
import { ExpandedEnvironment } from "../../../aas/domain/expanded-environment";
import { AasExportable } from "../../../aas/domain/exportable/aas-exportable";
import { SubjectAttributes } from "../../../aas/domain/security/subject-attributes";
import { EnvironmentService } from "../../../aas/presentation/environment.service";
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
import { handleDppStatusChangeRequest } from "../../../digital-product-document/domain/digital-product-document-status";
import { DigitalProductDocumentService } from "../../../digital-product-document/application/digital-product-document.service";

@Injectable()
export class PassportService {
  private readonly logger = new Logger(PassportService.name);
  public readonly digitalProductDocumentService: DigitalProductDocumentService<Passport>;
  constructor(
    private readonly passportRepository: PassportRepository,
    private readonly environmentService: EnvironmentService,
    @InjectConnection() private connection: Connection,
    private readonly uniqueProductIdentifierRepository: UniqueProductIdentifierRepository,
    private readonly presentationConfigurationService: PresentationConfigurationService,
    private readonly presentationConfigurationRepository: PresentationConfigurationRepository,
    private readonly permalinkRepository: PermalinkRepository,
  ) {
    this.digitalProductDocumentService = new DigitalProductDocumentService(
      this.environmentService,
      this.passportRepository,
    );
  }

  async getExpandedProductPassport(passportId: string): Promise<AasExportable> {
    const passport = await this.passportRepository.findOne(passportId);
    if (!passport) {
      throw new NotFoundException(`Product passport with id ${passportId} not found`);
    }
    const presentationConfiguration =
      await this.presentationConfigurationService.getEffectiveForPassport(passport);

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
    const updatedPassport = handleDppStatusChangeRequest(passport, body);
    return PassportDtoSchema.parse((await this.passportRepository.save(updatedPassport)).toPlain());
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

        // Drop the permalink by joining through the passport reference so a
        // previously-orphaned permalink (config missing) still gets cleaned up.
        const permalink = await this.permalinkRepository.findByPassportId(passport.id, { session });
        if (permalink) {
          await this.permalinkRepository.deleteByPresentationConfigurationId(
            permalink.presentationConfigurationId,
            { session },
          );
        }
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
