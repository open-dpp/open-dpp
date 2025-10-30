import { Injectable } from "@nestjs/common";
import { DppApiClient, ProductPassportDto } from "@open-dpp/api-client";
import { EnvService } from "@open-dpp/env";

@Injectable()
export class DppService {
  private readonly dppClient: DppApiClient;

  constructor(configService: EnvService) {
    const baseURL = configService.get("DPP_API_URL");
    if (!baseURL) {
      throw new Error("DPP_API_URL is not set");
    }
    this.dppClient = new DppApiClient({ baseURL });
  }

  async getProductPassport(uuid: string): Promise<ProductPassportDto> {
    return (await this.dppClient.productPassports.getById(uuid)).data;
  }
}
