import { DppApiClient, ProductPassportDto } from '@open-dpp/api-client';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DppService {
  private readonly dppClient: DppApiClient;

  constructor(configService: ConfigService) {
    const baseURL = configService.get<string>('DPP_API_URL');
    if (!baseURL) {
      throw new Error('DPP_API_URL is not set');
    }
    this.dppClient = new DppApiClient({ baseURL: baseURL });
  }

  async getProductPassport(uuid: string): Promise<ProductPassportDto> {
    return (await this.dppClient.productPassports.getById(uuid)).data;
  }
}
