import { OpenDppClient } from '../../src'
import { marketplaceURL } from './handlers'
import { passportTemplate } from './handlers/passport-templates'
import { server } from './msw.server'

describe('marketplaceApiClient', () => {
  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  describe('passport templates', () => {
    it('should return passport templates', async () => {
      const sdk = new OpenDppClient({
        marketplace: { baseURL: marketplaceURL },
      })
      const response = await sdk.marketplace.passportTemplates.getAll()
      expect(response.data).toEqual([passportTemplate])
    })
  })
})
