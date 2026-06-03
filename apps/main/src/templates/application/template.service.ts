import type { Connection } from "mongoose";
import { ForbiddenException, Injectable, Logger } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";

import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import { EnvironmentService, UserContext } from "../../aas/presentation/environment.service";
import { PresentationConfigurationRepository } from "../../presentation-configurations/infrastructure/presentation-configuration.repository";
import { Template } from "../domain/template";
import { TemplateRepository } from "../infrastructure/template.repository";
import {
  DigitalProductDocumentStatusModificationDto,
  PresentationReferenceType,
  TemplateDtoSchema,
} from "@open-dpp/dto";
import { DigitalProductDocumentService } from "../../digital-product-document/application/digital-product-document.service";
import { ActivityRepository } from "../../activity-history/infrastructure/activity.repository";
import { handleDppStatusChangeRequest } from "../../digital-product-document/domain/digital-product-document-status";
import { DigitalProductDocumentStatusChangedActivity } from "../../activity-history/domain/activities/digital-product-document-status-changed.activity";

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);
  public readonly digitalProductDocumentService: DigitalProductDocumentService<Template>;

  constructor(
    private readonly templateRepository: TemplateRepository,
    private readonly environmentService: EnvironmentService,
    private readonly activityRepository: ActivityRepository,
    @InjectConnection() private connection: Connection,
    private readonly presentationConfigurationRepository: PresentationConfigurationRepository,
  ) {
    this.digitalProductDocumentService = new DigitalProductDocumentService(
      this.environmentService,
      this.templateRepository,
      this.activityRepository,
      this.connection,
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
          { referenceType: PresentationReferenceType.Template, referenceId: template.id },
          { session },
        );
      });
    } finally {
      await session.endSession();
    }
  }
}
