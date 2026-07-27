import type { Connection } from "mongoose";
import { ForbiddenException, Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";

import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import { EnvironmentService, UserContext } from "../../aas/presentation/environment.service";
import { BulkImportConfigService } from "../../bulk-import/application/services/bulk-import-config.service";
import { PresentationConfigurationRepository } from "../../presentation-configurations/infrastructure/presentation-configuration.repository";
import { Template } from "../domain/template";
import { TemplateRepository } from "../infrastructure/template.repository";
import {
  DigitalProductDocumentStatusModificationDto,
  DigitalProductDocumentTypes,
  TemplateDtoSchema,
} from "@open-dpp/dto";
import { DigitalProductDocumentService } from "../../digital-product-document/application/digital-product-document.service";
import { ActivityRepository } from "../../activity-history/infrastructure/activity.repository";
import { handleDppStatusChangeRequest } from "../../digital-product-document/domain/digital-product-document-status";
import { DigitalProductDocumentStatusChangedActivity } from "../../activity-history/domain/activities/digital-product-document-status-changed.activity";
import { PresentationConfigurationService } from "../../presentation-configurations/application/services/presentation-configuration.service";

@Injectable()
export class TemplateService {
  public readonly digitalProductDocumentService: DigitalProductDocumentService<Template>;

  constructor(
    private readonly templateRepository: TemplateRepository,
    private readonly environmentService: EnvironmentService,
    private readonly activityRepository: ActivityRepository,
    private readonly presentationConfigurationRepository: PresentationConfigurationRepository,
    @InjectConnection() private readonly connection: Connection,
    presentationConfigurationService: PresentationConfigurationService,
    private readonly bulkImportConfigService: BulkImportConfigService,
  ) {
    this.digitalProductDocumentService = new DigitalProductDocumentService(
      this.environmentService,
      this.templateRepository,
      this.activityRepository,
      presentationConfigurationService,
    );
  }

  async modifyTemplateStatus(
    correlationId: string,
    organizationId: string,
    id: string,
    body: DigitalProductDocumentStatusModificationDto,
    userContext: UserContext,
  ) {
    const template =
      await this.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
        id,
        userContext.subject,
        organizationId,
      );
    handleDppStatusChangeRequest(template, body);
    const activity = DigitalProductDocumentStatusChangedActivity.create({
      correlationId,
      userId: userContext.userId,
      digitalProductDocumentId: id,
      item: template,
    });
    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        await this.templateRepository.save(template, { session });
        if (!activity.isNoop()) {
          await this.activityRepository.createMany([activity], { session });
        }
      });
    } finally {
      await session.endSession();
    }
    return TemplateDtoSchema.parse(template.toPlain());
  }

  async deleteTemplate(id: string, organizationId: string, subject: SubjectAttributes) {
    const template =
      await this.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
        id,
        subject,
        organizationId,
      );
    if (!template.isDraft()) {
      throw new ForbiddenException('Only templates with the status "Draft" can be deleted');
    }

    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        await this.environmentService.deleteEnvironment(template.environment, session);
        await this.templateRepository.deleteById(template.id, { session });
        await this.activityRepository.deleteByAggregateId(template.id, { session });
        await this.presentationConfigurationRepository.deleteByReference(
          { referenceType: DigitalProductDocumentTypes.Template, referenceId: template.id },
          { session },
        );
        await this.bulkImportConfigService.deleteAllByTemplateId(template.id, { session });
      });
    } finally {
      await session.endSession();
    }
  }
}
