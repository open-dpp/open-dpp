import type { ApiClientOptions, IApiClient } from './api-client'
import { AgentServerApiClient } from './agent-server/agent-server-api-client'
import { AnalyticsApiClient } from './analytics/analytics-api-client'
import { DppApiClient } from './dpp/dpp-api-client'
import { MediaApiClient } from './media/media-api-client'
import { StatusApiClient } from './status/status-api-client'

interface OpenDppClientOptions {
  dpp?: ApiClientOptions
  marketplace?: ApiClientOptions
  agentServer?: ApiClientOptions
  analytics?: ApiClientOptions
  media?: ApiClientOptions
  status?: ApiClientOptions
}

export class OpenDppClient {
  public readonly dpp: DppApiClient
  public readonly agentServer: AgentServerApiClient
  public readonly analytics: AnalyticsApiClient
  public readonly media: MediaApiClient
  public readonly status: StatusApiClient
  private readonly clients: IApiClient[]
  constructor({
    dpp = {},
    agentServer = {},
    analytics = {},
    media = {},
    status = {},
  }: OpenDppClientOptions) {
    this.dpp = new DppApiClient(dpp)
    this.agentServer = new AgentServerApiClient(agentServer)
    this.analytics = new AnalyticsApiClient(analytics)
    this.media = new MediaApiClient(media)
    this.status = new StatusApiClient(status)
    this.clients = [
      this.dpp,
      this.agentServer,
      this.analytics,
      this.media,
      this.status,
    ]
  }

  public setApiKey(apiKey: string) {
    this.clients.forEach(client => client.setApiKey(apiKey))
  }

  public setActiveOrganizationId(id: string) {
    this.clients.forEach(client => client.setActiveOrganizationId(id))
  }
}
