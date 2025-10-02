import type { ConfigService } from '@nestjs/config'
import { Injectable } from '@nestjs/common'
import { DppApiClient } from '@open-dpp/api-client'
import { Passport } from './domain/passport'

@Injectable()
export class PassportService {
  private readonly dppApiClient: DppApiClient

  constructor(configService: ConfigService) {
    const baseURL = configService.get<string>('DPP_API_URL')
    const serviceToken = configService.get<string>('API_SERVICE_TOKEN')
    if (!baseURL) {
      throw new Error('DPP_API_URL is not set')
    }
    if (!serviceToken) {
      throw new Error('API_SERVICE_TOKEN is not set')
    }
    this.dppApiClient = new DppApiClient({ baseURL, serviceToken })
  }

  async findOneOrFail(uuid: string): Promise<Passport | undefined> {
    const response
      = await this.dppApiClient.uniqueProductIdentifiers.getMetadata(uuid)
    const { organizationId } = response.data
    return Passport.create({
      uuid,
      ownedByOrganizationId: organizationId,
    })
  }
}
