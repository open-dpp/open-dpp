import {
  MarketplaceApiClient,
  PassportTemplateDto,
} from '@open-dpp/api-client';
import { ConfigService } from '@nestjs/config';
import { OrganizationsService } from '../organizations/infrastructure/organizations.service';
import { Template } from '../templates/domain/template';
import { Injectable, Logger } from '@nestjs/common';
import {
  deserializeTemplate,
  serializeTemplate,
} from '../templates/domain/serialization';
import { TemplateDoc } from '../templates/infrastructure/template.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TemplateService } from '../templates/infrastructure/template.service';
import { PassportTemplate } from './passport-templates/domain/passport-template';
import { PassportTemplateService } from './passport-templates/infrastructure/passport-template.service';
import { KeycloakUserInToken } from '@app/auth/keycloak-auth/KeycloakUserInToken';

@Injectable()
export class MarketplaceService {
  private readonly marketplaceClient: MarketplaceApiClient;
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(
    configService: ConfigService,
    private organizationService: OrganizationsService,
    @InjectModel(TemplateDoc.name)
    private templateDoc: Model<TemplateDoc>,
    private templateService: TemplateService,
    private passportTemplateService: PassportTemplateService,
  ) {
    const baseURL = configService.get<string>('MARKETPLACE_URL');
    if (!baseURL) {
      throw new Error('MARKETPLACE_URL is not set');
    }
    this.marketplaceClient = new MarketplaceApiClient({ baseURL });
  }

  async upload(
    template: Template,
    keycloakUser: Pick<KeycloakUserInToken, 'sub' | 'email'>,
  ): Promise<PassportTemplate> {
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
          contactEmail: keycloakUser.email,
          isOfficial: false,
          ownedByOrganizationId: organization.id,
          createdByUserId: keycloakUser.sub,
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

    const response = await this.marketplaceClient.passportTemplates.getById(
      marketplaceResourceId,
    );

    // Validate response and response.data
    if (!response) {
      throw new Error('Invalid response from marketplace API');
    }

    if (!response.data) {
      throw new Error('Invalid response data from marketplace API');
    }

    // Validate response.data.templateData
    if (
      !response.data.templateData ||
      typeof response.data.templateData !== 'object'
    ) {
      throw new Error('Invalid template data in marketplace API response');
    }

    // Create a template document with validated data
    const templateDoc = new this.templateDoc(response.data.templateData);
    templateDoc._id = response.data.id;

    await templateDoc.validate();

    const template = deserializeTemplate(templateDoc.toObject()).copy(
      organizationId,
      userId,
    );

    template.assignMarketplaceResource(response.data.id);
    await this.templateService.save(template);
    return template;
  }
}
