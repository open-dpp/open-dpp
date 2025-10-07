import type { ApiClientOptions, IApiClient } from './api-client'
import { AgentServerApiClient } from './agent-server/agent-server-api-client'
import { AnalyticsApiClient } from './analytics/analytics-api-client'
import { DppApiClient } from './dpp/dpp-api-client'
import { MarketplaceApiClient } from './marketplace/marketplace-api-client'

interface OpenDppClientOptions {
  dpp?: ApiClientOptions
  marketplace?: ApiClientOptions
  agentServer?: ApiClientOptions
  analytics?: ApiClientOptions
}

export class OpenDppClient {
  public readonly dpp: DppApiClient
  public readonly marketplace: MarketplaceApiClient
  public readonly agentServer: AgentServerApiClient
  public readonly analytics: AnalyticsApiClient
  private readonly clients: IApiClient[]
  constructor({
    dpp = {},
    marketplace = {},
    agentServer = {},
    analytics = {},
  }: OpenDppClientOptions) {
    this.dpp = new DppApiClient(dpp)
    this.marketplace = new MarketplaceApiClient(marketplace)
    this.agentServer = new AgentServerApiClient(agentServer)
    this.analytics = new AnalyticsApiClient(analytics)
    this.clients = [
      this.dpp,
      this.marketplace,
      this.agentServer,
      this.analytics,
    ]
  }

  public setApiKey(apiKey: string) {
    this.clients.forEach(client => client.setApiKey(apiKey))
  }

  public setActiveOrganizationId(id: string) {
    this.clients.forEach(client => client.setActiveOrganizationId(id))
  }
}
