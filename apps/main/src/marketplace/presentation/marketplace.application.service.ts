import type { Model } from "mongoose";
import type { User } from "../../identity/users/domain/user";
import type { Template } from "../../old-templates/domain/template";
import { randomUUID } from "node:crypto";
import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import {
  deserializeTemplate,
  serializeTemplate,
} from "../../old-templates/domain/serialization";
import { OldTemplateDoc } from "../../old-templates/infrastructure/template.schema";
import { TemplateService } from "../../old-templates/infrastructure/template.service";
import { PassportTemplatePublication } from "../domain/passport-template-publication";
import { PassportTemplatePublicationService } from "../infrastructure/passport-template-publication.service";

@Injectable()
export class MarketplaceApplicationService {
  private readonly logger = new Logger(MarketplaceApplicationService.name);

  constructor(
    @InjectModel(OldTemplateDoc.name)
    private TemplateDoc: Model<OldTemplateDoc>,
    private templateService: TemplateService,
    private passportTemplateService: PassportTemplatePublicationService,
  ) {}

  async upload(
    template: Template,
    user: User,
    organizationId: string,
    organizationName: string,
  ): Promise<PassportTemplatePublication> {
    try {
      const templateData = serializeTemplate(template);
      return await this.passportTemplateService.save(
        PassportTemplatePublication.create({
          website: null,
          version: template.version,
          name: template.name,
          description: template.description,
          sectors: template.sectors,
          organizationName,
          templateData,
          contactEmail: user.email,
          isOfficial: false,
          ownedByOrganizationId: organizationId,
          createdByUserId: user.id,
        }),
      );
    }
    catch (error) {
      this.logger.error(
        `Failed to upload template to marketplace: ${error.message}`,
        error.stack,
      );
      throw new Error(
        `Failed to upload template to marketplace: ${error.message}`,
      );
    }
  }

  async download(
    organizationId: string,
    userId: string,
    marketplaceResourceId: string,
  ): Promise<Template> {
    const existingTemplate
      = await this.templateService.findByMarketplaceResource(
        organizationId,
        marketplaceResourceId,
      );
    if (existingTemplate) {
      return existingTemplate;
    }

    const passportTemplate = await this.passportTemplateService.findOneOrFail(
      marketplaceResourceId,
    );

    // Create a template document with validated data
    const templateDoc = new this.TemplateDoc(passportTemplate.templateData);
    templateDoc._id = randomUUID();

    await templateDoc.validate();

    const template = deserializeTemplate(templateDoc.toObject()).copy(
      organizationId,
      userId,
    );

    template.assignMarketplaceResource(passportTemplate.id);
    await this.templateService.save(template);
    return template;
  }
}
