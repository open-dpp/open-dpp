import type { AxiosInstance } from 'axios'
import type { ApiClientOptions, IApiClient } from '../api-client'
import { createAxiosClient } from '../api-client'
import { BrandingNamespace } from './branding/branding.namespace'
import { InstanceSettingsNamespace } from './instance-settings/instance-settings.namespace'
import { AasIntegrationNamespace } from './integrations/aas-integration.namespace'
import { OrganizationsNamespace } from './organizations/organizations.namespace'
import { PassportNamespace } from './passport/passports.namespace'
import { TemplatesNamespace } from './templates/templates.namespace'
import { UniqueProductIdentifiersNamespace } from './unique-product-identifiers/unique-product-identifiers.namespace'
import { UsersNamespace } from './users/users.namespace'

export class DppApiClient implements IApiClient {
  public organizations!: OrganizationsNamespace
  public templates!: TemplatesNamespace
  public passports!: PassportNamespace
  public branding!: BrandingNamespace

  public uniqueProductIdentifiers!: UniqueProductIdentifiersNamespace
  public aasIntegration!: AasIntegrationNamespace
  public users!: UsersNamespace
  public instanceSettings!: InstanceSettingsNamespace
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

    this.templates = new TemplatesNamespace(this.axiosInstance)
    this.passports = new PassportNamespace(this.axiosInstance)
    this.branding = new BrandingNamespace(this.axiosInstance)
    this.aasIntegration = new AasIntegrationNamespace(
      this.axiosInstance,
    )

    this.uniqueProductIdentifiers = new UniqueProductIdentifiersNamespace(
      this.axiosInstance,
    )
    this.users = new UsersNamespace(this.axiosInstance)
    this.instanceSettings = new InstanceSettingsNamespace(this.axiosInstance)
  }
}
