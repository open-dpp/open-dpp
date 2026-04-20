import type { Connection } from "mongoose";
import { ForbiddenException, Injectable, Logger } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";

import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import { EnvironmentService } from "../../aas/presentation/environment.service";
import { Template } from "../domain/template";
import { TemplateRepository } from "../infrastructure/template.repository";
import { DigitalProductDocumentStatusModificationDto, TemplateDtoSchema } from "@open-dpp/dto";
import { handleDppStatusChangeRequest } from "../../digital-product-document/domain/digital-product-document-status";
import { DigitalProductDocumentService } from "../../digital-product-document/application/digital-product-document.service";

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);
  public readonly digitalProductDocumentService: DigitalProductDocumentService<Template>;

  constructor(
    private readonly templateRepository: TemplateRepository,
    private readonly environmentService: EnvironmentService,
    @InjectConnection() private connection: Connection,
  ) {
    this.digitalProductDocumentService = new DigitalProductDocumentService(
      this.environmentService,
      this.templateRepository,
    );
  }

  async modifyTemplateStatus(
    id: string,
    organizationId: string,
    subject: SubjectAttributes,
    body: DigitalProductDocumentStatusModificationDto,
  ) {
    const template =
      await this.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
        id,
        subject,
        organizationId,
      );
    handleDppStatusChangeRequest(template, body);
    return TemplateDtoSchema.parse((await this.templateRepository.save(template)).toPlain());
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
      });
    } finally {
      await session.endSession();
    }
  }
}
