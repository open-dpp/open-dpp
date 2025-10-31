import { Injectable } from "@nestjs/common";
import { DppApiClient } from "@open-dpp/api-client";
import { EnvService } from "@open-dpp/env";
import { Passport } from "./domain/passport";

@Injectable()
export class PassportService {
  private readonly dppApiClient: DppApiClient;

  constructor(configService: EnvService) {
    const baseURL = configService.get("OPEN_DPP_URL");
    const serviceToken = configService.get("OPEN_DPP_SERVICE_TOKEN");
    if (!baseURL) {
      throw new Error("OPEN_DPP_URL is not set");
    }
    if (!serviceToken) {
      throw new Error("API_SERVICE_TOKEN is not set");
    }
    this.dppApiClient = new DppApiClient({ baseURL: `${baseURL}/api`, serviceToken });
  }

  async findOneOrFail(uuid: string): Promise<Passport | undefined> {
    const response
      = await this.dppApiClient.uniqueProductIdentifiers.getMetadata(uuid);
    const { organizationId } = response.data;
    return Passport.create({
      uuid,
      ownedByOrganizationId: organizationId,
    });
  }
}
