import type { ConfigService } from '@nestjs/config'
import type {
  PassportTemplateDto,
} from '@open-dpp/api-client'
import type { Model } from 'mongoose'
import type { OrganizationsService } from '../organizations/infrastructure/organizations.service'
import type { Template } from '../templates/domain/template'
import type { TemplateService } from '../templates/infrastructure/template.service'
import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import {
  MarketplaceApiClient,
} from '@open-dpp/api-client'
import {
  deserializeTemplate,
  serializeTemplate,
} from '../templates/domain/serialization'
import { TemplateDoc } from '../templates/infrastructure/template.schema'

@Injectable()
export class MarketplaceService {
  private readonly marketplaceClient: MarketplaceApiClient
  private readonly logger = new Logger(MarketplaceService.name)

  constructor(
    configService: ConfigService,
    private organizationService: OrganizationsService,
    @InjectModel(TemplateDoc.name)
    private TemplateModel: Model<TemplateDoc>,
    private templateService: TemplateService,
  ) {
    const baseURL = configService.get<string>('MARKETPLACE_URL')
    if (!baseURL) {
      throw new Error('MARKETPLACE_URL is not set')
    }
    this.marketplaceClient = new MarketplaceApiClient({ baseURL })
  }

  async upload(
    template: Template,
    token: string,
  ): Promise<PassportTemplateDto> {
    try {
      const templateData = serializeTemplate(template)
      const organization = await this.organizationService.findOneOrFail(
        template.ownedByOrganizationId,
      )
      this.marketplaceClient.setActiveOrganizationId(organization.id)
      this.marketplaceClient.setApiKey(token)
      const response = await this.marketplaceClient.passportTemplates.create({
        version: template.version,
        name: template.name,
        description: template.description,
        sectors: template.sectors,
        organizationName: organization.name,
        templateData,
      })
      return response.data
    }
    catch (error) {
      this.logger.error(
        `Failed to upload template to marketplace: ${error.message}`,
        error.stack,
      )
      throw new Error(
        `Failed to upload template to marketplace: ${error.message}`,
      )
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
      )
    if (existingTemplate) {
      return existingTemplate
    }

    const response = await this.marketplaceClient.passportTemplates.getById(
      marketplaceResourceId,
    )

    // Validate response and response.data
    if (!response) {
      throw new Error('Invalid response from marketplace API')
    }

    if (!response.data) {
      throw new Error('Invalid response data from marketplace API')
    }

    // Validate response.data.templateData
    if (
      !response.data.templateData
      || typeof response.data.templateData !== 'object'
    ) {
      throw new Error('Invalid template data in marketplace API response')
    }

    // Create a template document with validated data
    const templateDoc = new this.TemplateModel(response.data.templateData)
    templateDoc._id = response.data.id

    await templateDoc.validate()

    const template = deserializeTemplate(templateDoc.toObject()).copy(
      organizationId,
      userId,
    )

    template.assignMarketplaceResource(response.data.id)
    await this.templateService.save(template)
    return template
  }
}
