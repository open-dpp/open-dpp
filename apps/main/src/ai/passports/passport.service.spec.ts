import type { TestingModule } from '@nestjs/testing'
import { randomUUID } from 'node:crypto'
import { expect } from '@jest/globals'
import { ConfigService } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import { Passport } from './domain/passport'
import { PassportService } from './passport.service'

const mockGetMetadata = jest.fn()

jest.mock('@open-dpp/api-client', () => ({
  ...jest.requireActual('@open-dpp/api-client'),
  DppApiClient: jest.fn().mockImplementation(() => ({
    uniqueProductIdentifiers: {
      getMetadata: mockGetMetadata,
    },
  })),
}))

describe('passportService', () => {
  let service: PassportService
  let module: TestingModule

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [],
      providers: [
        PassportService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key) => {
              if (key === 'DPP_API_URL') {
                return 'http://api.url'
              }
              else if (key === 'API_SERVICE_TOKEN') {
                return 'service-token'
              }
              else {
                return undefined
              }
            }),
          },
        },
      ],
    }).compile()
    service = module.get<PassportService>(PassportService)
  })

  it('should find passport', async () => {
    const organizationId = randomUUID()
    mockGetMetadata.mockResolvedValue({
      data: { organizationId },
    })
    const uuid = randomUUID()
    const found = await service.findOneOrFail(uuid)
    expect(found).toEqual(
      Passport.create({ uuid, ownedByOrganizationId: organizationId }),
    )
    expect(mockGetMetadata).toHaveBeenCalledWith(uuid)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  afterAll(async () => {
    await module.close()
  })
})
