import { AiProvider, OpenDppClient } from '../../src'
import { activeOrganization } from '../organization'
import { agentServerURL } from './handlers'
import { aiConfigurationDto } from './handlers/ai-configurations'
import { server } from './msw.server'

describe('agentServerApiClient', () => {
  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  describe('ai configuration', () => {
    const sdk = new OpenDppClient({
      agentServer: { baseURL: agentServerURL },
    })
    sdk.setActiveOrganizationId(activeOrganization.id)
    it('should create ai configuration', async () => {
      const response = await sdk.agentServer.aiConfigurations.upsert({
        provider: AiProvider.Mistral,
        model: 'codestral-latest',
        isEnabled: true,
      })
      expect(response.data).toEqual(aiConfigurationDto)
    })
    it('should return ai configuration', async () => {
      const response = await sdk.agentServer.aiConfigurations.get()
      expect(response.data).toEqual(aiConfigurationDto)
    })
  })
})
