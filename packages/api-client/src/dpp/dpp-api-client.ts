import type { AxiosInstance } from 'axios'
import type { ApiClientOptions, IApiClient } from '../api-client'
import { createAxiosClient } from '../api-client'
import { AasIntegrationNamespace } from './integrations/aas-integration.namespace'
import { ItemsNamespace } from './items/items.namespace'
import { ModelsNamespace } from './models/models.namespace'
import { OldTemplatesNamespace } from './old-templates/oldTemplatesNamespace'
import { OrganizationsNamespace } from './organizations/organizations.namespace'
import { PassportsNamespace } from './passports/passports.namespace'
import { ProductPassportsNamespace } from './product-passport/product-passports.namespace'
import { TemplateDraftsNamespace } from './template-drafts/template-drafts.namespace'
import { TemplatesNamespace } from './templates/templates.namespace'
import { UniqueProductIdentifiersNamespace } from './unique-product-identifiers/unique-product-identifiers.namespace'

export class DppApiClient implements IApiClient {
  public organizations!: OrganizationsNamespace
  public models!: ModelsNamespace
  public items!: ItemsNamespace
  public templateDrafts!: TemplateDraftsNamespace
  public oldTemplates!: OldTemplatesNamespace
  public templates!: TemplatesNamespace
  public passports!: PassportsNamespace

  public uniqueProductIdentifiers!: UniqueProductIdentifiersNamespace
  public productPassports!: ProductPassportsNamespace
  public aasIntegration!: AasIntegrationNamespace
  private axiosInstance!: AxiosInstance
  private options: ApiClientOptions

  constructor(options: ApiClientOptions = {}) {
    this.options = options
    this.createNewAxiosInstance()
  }

  public setApiKey(apiKey: string) {
    this.options.apiKey = apiKey
    this.createNewAxiosInstance()
  }

  public setActiveOrganizationId(id: string) {
    this.options.activeOrganizationId = id
    this.createNewAxiosInstance()
  }

  private createNewAxiosInstance() {
    this.axiosInstance = createAxiosClient(
      this.options,
      'https://api.cloud.open-dpp.de',
    )
    this.organizations = new OrganizationsNamespace(this.axiosInstance)
    this.models = new ModelsNamespace(
      this.axiosInstance,
      this.options.activeOrganizationId,
    )
    this.items = new ItemsNamespace(
      this.axiosInstance,
      this.options.activeOrganizationId,
    )
    this.oldTemplates = new OldTemplatesNamespace(
      this.axiosInstance,
      this.options.activeOrganizationId,
    )
    this.templates = new TemplatesNamespace(this.axiosInstance)
    this.passports = new PassportsNamespace(this.axiosInstance)

    this.templateDrafts = new TemplateDraftsNamespace(
      this.axiosInstance,
      this.options.activeOrganizationId,
    )
    this.aasIntegration = new AasIntegrationNamespace(
      this.axiosInstance,
      this.options.activeOrganizationId,
    )
    this.productPassports = new ProductPassportsNamespace(this.axiosInstance)

    this.uniqueProductIdentifiers = new UniqueProductIdentifiersNamespace(
      this.axiosInstance,
      this.options.activeOrganizationId,
    )
  }
}
