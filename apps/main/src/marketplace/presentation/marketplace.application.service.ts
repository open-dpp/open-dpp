import type { Model } from "mongoose";
import type { Template } from "../../templates/domain/template";
import type { User } from "../../users/domain/user";
import { randomUUID } from "node:crypto";
import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { OrganizationsService } from "../../organizations/infrastructure/organizations.service";
import {
  deserializeTemplate,
  serializeTemplate,
} from "../../templates/domain/serialization";
import { TemplateDoc } from "../../templates/infrastructure/template.schema";
import { TemplateService } from "../../templates/infrastructure/template.service";
import { PassportTemplatePublication } from "../domain/passport-template-publication";
import { PassportTemplatePublicationService } from "../infrastructure/passport-template-publication.service";

@Injectable()
export class MarketplaceApplicationService {
  private readonly logger = new Logger(MarketplaceApplicationService.name);

  constructor(
    private organizationService: OrganizationsService,
    @InjectModel(TemplateDoc.name)
    private TemplateDoc: Model<TemplateDoc>,
    private templateService: TemplateService,
    private passportTemplateService: PassportTemplatePublicationService,
  ) {}

  async upload(
    template: Template,
    user: User,
  ): Promise<PassportTemplatePublication> {
    try {
      const templateData = serializeTemplate(template);
      const organization = await this.organizationService.findOneOrFail(
        template.ownedByOrganizationId,
      );
      return await this.passportTemplateService.save(
        PassportTemplatePublication.create({
          website: null,
          version: template.version,
          name: template.name,
          description: template.description,
          sectors: template.sectors,
          organizationName: organization.name,
          templateData,
          contactEmail: user.email,
          isOfficial: false,
          ownedByOrganizationId: organization.id,
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
