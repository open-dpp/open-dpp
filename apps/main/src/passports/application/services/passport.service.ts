import type { Connection } from "mongoose";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { DbSessionOptions } from "../../../database/query-options";
import { TransactionService } from "../../../database/transaction.service";
import { Environment } from "../../../aas/domain/environment";
import { ExpandedEnvironment } from "../../../aas/domain/expanded-environment";
import { AasExportable } from "../../../aas/domain/exportable/aas-exportable";
import { SubjectAttributes } from "../../../aas/domain/security/subject-attributes";
import { EnvironmentService, UserContext } from "../../../aas/presentation/environment.service";
import { PermalinkApplicationService } from "../../../permalink/application/services/permalink.application.service";
import { PermalinkRepository } from "../../../permalink/infrastructure/permalink.repository";
import {
  PresentationConfigurationService,
  PresentationReferenceHolder,
} from "../../../presentation-configurations/application/services/presentation-configuration.service";
import { PresentationConfigurationRepository } from "../../../presentation-configurations/infrastructure/presentation-configuration.repository";
import { Template } from "../../../templates/domain/template";
import { TemplateRepository } from "../../../templates/infrastructure/template.repository";
import { UniqueProductIdentifierRepository } from "../../../unique-product-identifier/infrastructure/unique-product-identifier.repository";
import { Passport } from "../../domain/passport";
import { PassportRepository } from "../../infrastructure/passport.repository";
import {
  DigitalProductDocumentStatusModificationDto,
  DigitalProductDocumentStatusModificationMethodDto,
  PassportDtoSchema,
  DigitalProductDocumentTypes,
} from "@open-dpp/dto";
import { handleDppStatusChangeRequest } from "../../../digital-product-document/domain/digital-product-document-status";
import { DigitalProductDocumentService } from "../../../digital-product-document/application/digital-product-document.service";
import { ActivityRepository } from "../../../activity-history/infrastructure/activity.repository";
import { DigitalProductDocumentStatusChangedActivity } from "../../../activity-history/domain/activities/digital-product-document-status-changed.activity";

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
    private readonly templateRepository: TemplateRepository,
    private readonly transactionService: TransactionService,
  ) {
    this.digitalProductDocumentService = new DigitalProductDocumentService(
      this.environmentService,
      this.passportRepository,
      this.activityRepository,
      this.presentationConfigurationService,
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
        userContext.subject,
        organizationId,
      );
    handleDppStatusChangeRequest(passport, body);
    const activity = DigitalProductDocumentStatusChangedActivity.create({
      correlationId,
      userId: userContext.userId,
      digitalProductDocumentId: id,
      item: passport,
    });

    const saved = await this.transactionService.withTransaction(async (options) => {
      const persisted = await this.passportRepository.save(passport, options);
      if (body.method === DigitalProductDocumentStatusModificationMethodDto.Publish) {
        await this.permalinkApplicationService.freezeAllForPassport(persisted, options);
      }
      if (!activity.isNoop()) {
        await this.activityRepository.createMany([activity], options);
      }
      return persisted;
    });
    return PassportDtoSchema.parse(saved.toPlain());
  }

  async createPassportFromTemplate(
    organizationId: string,
    templateId: string,
    subject: SubjectAttributes,
    options?: DbSessionOptions,
  ): Promise<Passport> {
    const template = await this.loadTemplateAndCheckOwnership(templateId, subject, organizationId);
    if (template.isArchived()) {
      throw new BadRequestException(
        `Template ${templateId} is archived and cannot be used to create a passport`,
      );
    }
    const environment = await this.environmentService.copyEnvironment(template.environment);
    return await this.createAndPersistPassport(organizationId, environment, templateId, options);
  }

  /**
   * Pass `options` to join an existing transaction (e.g. so a caller can persist related
   * data alongside the passport atomically); omit it to run in its own transaction.
   */
  async createAndPersistPassport(
    organizationId: string,
    environment: Environment,
    templateId?: string,
    options?: DbSessionOptions,
  ): Promise<Passport> {
    const passport = Passport.create({
      organizationId,
      templateId,
      environment,
    });
    const upid = passport.createUniqueProductIdentifier();

    const persist = async (txOptions: DbSessionOptions) => {
      await this.uniqueProductIdentifierRepository.save(upid, txOptions);
      const persisted = await this.passportRepository.save(passport, txOptions);
      const snapshotConfigs =
        await this.presentationConfigurationService.snapshotTemplateConfigsToPassport(
          persisted,
          txOptions,
        );
      const configs =
        snapshotConfigs.length > 0
          ? snapshotConfigs
          : [
              await this.presentationConfigurationService.ensureDefaultForPassport(
                persisted,
                txOptions,
              ),
            ];
      await this.permalinkApplicationService.createPermalinksForConfigs(
        configs,
        organizationId,
        txOptions,
      );
      return persisted;
    };

    return options
      ? await persist(options)
      : await this.transactionService.withTransaction(persist);
  }

  private async loadTemplateAndCheckOwnership(
    id: string,
    subject: SubjectAttributes,
    organizationId: string,
  ): Promise<Template> {
    const template = await this.templateRepository.findOneOrFail(id);
    if (template.getOrganizationId() !== organizationId || subject.memberRole === undefined) {
      throw new ForbiddenException();
    }
    return template;
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

    const upis = await this.uniqueProductIdentifierRepository.findAllByReferencedId(passport.id);

    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        await this.environmentService.deleteEnvironment(passport.getEnvironment(), session);
        await this.passportRepository.deleteById(passport.id, { session });
        await this.permalinkRepository.deleteGs1LinksByUpiIds(
          upis.map((upi) => upi.uuid),
          { session },
        );
        await this.uniqueProductIdentifierRepository.deleteByReferenceId(passport.id, { session });
        await this.activityRepository.deleteByAggregateId(passport.id, { session });
        await this.permalinkRepository.deleteAllByPassportId(passport.id, { session });
        await this.presentationConfigurationRepository.deleteByReference(
          { referenceType: DigitalProductDocumentTypes.Passport, referenceId: passport.id },
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
    referenceType: DigitalProductDocumentTypes.Passport,
  };
}
