import { OpenDppClient } from '../../src'
import { activeOrganization } from '../organization'
import { marketplaceURL } from './handlers'
import { passportTemplate } from './handlers/passport-templates'
import { server } from './msw.server'

describe('marketplaceApiClient', () => {
  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  describe('passport templates', () => {
    it('should create passport template', async () => {
      const sdk = new OpenDppClient({
        marketplace: { baseURL: marketplaceURL },
      })
      sdk.setActiveOrganizationId(activeOrganization.id)
      const response
        = await sdk.marketplace.passportTemplates.create(passportTemplate)
      expect(response.data).toEqual(passportTemplate)
    })
    it('should return passport templates', async () => {
      const sdk = new OpenDppClient({
        marketplace: { baseURL: marketplaceURL },
      })
      const response = await sdk.marketplace.passportTemplates.getAll()
      expect(response.data).toEqual([passportTemplate])
    })

    it('should return passport template by id', async () => {
      const sdk = new OpenDppClient({
        marketplace: { baseURL: marketplaceURL },
      })
      const response = await sdk.marketplace.passportTemplates.getById(
        passportTemplate.id,
      )
      expect(response.data).toEqual(passportTemplate)
    })
  })
})
