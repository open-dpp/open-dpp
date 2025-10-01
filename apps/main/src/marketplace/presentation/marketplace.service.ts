import { OrganizationsService } from '../../organizations/infrastructure/organizations.service';
import { Template } from '../../templates/domain/template';
import { Injectable, Logger } from '@nestjs/common';
import {
  deserializeTemplate,
  serializeTemplate,
} from '../../templates/domain/serialization';
import { TemplateDoc } from '../../templates/infrastructure/template.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TemplateService } from '../../templates/infrastructure/template.service';
import { PassportTemplate } from '../domain/passport-template';
import { PassportTemplateService } from '../infrastructure/passport-template.service';
import { User } from '../../users/domain/user';
import { randomUUID } from 'crypto';

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(
    private organizationService: OrganizationsService,
    @InjectModel(TemplateDoc.name)
    private templateDoc: Model<TemplateDoc>,
    private templateService: TemplateService,
    private passportTemplateService: PassportTemplateService,
  ) {}

  async upload(template: Template, user: User): Promise<PassportTemplate> {
    try {
      const templateData = serializeTemplate(template);
      const organization = await this.organizationService.findOneOrFail(
        template.ownedByOrganizationId,
      );
      return await this.passportTemplateService.save(
        PassportTemplate.create({
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
    } catch (error) {
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
    const existingTemplate =
      await this.templateService.findByMarketplaceResource(
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
    const templateDoc = new this.templateDoc(passportTemplate.templateData);
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
