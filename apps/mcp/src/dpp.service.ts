import { Injectable } from "@nestjs/common";
import { DppApiClient, ProductPassportDto } from "@open-dpp/api-client";
import { EnvService } from "@open-dpp/env";

@Injectable()
export class DppService {
  private readonly dppClient: DppApiClient;

  constructor(configService: EnvService) {
    const baseURL = configService.get("OPEN_DPP_URL");
    if (!baseURL) {
      throw new Error("OPEN_DPP_URL is not set");
    }
    this.dppClient = new DppApiClient({ baseURL: `${baseURL}/api` });
  }

  async getProductPassport(uuid: string): Promise<ProductPassportDto> {
    return (await this.dppClient.productPassports.getById(uuid)).data;
  }
}
