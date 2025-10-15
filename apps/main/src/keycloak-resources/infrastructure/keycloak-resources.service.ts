import KcAdminClient from "@keycloak/keycloak-admin-client";
import {
  Injectable,
  Logger,
} from "@nestjs/common";
import { EnvService } from "@open-dpp/env";

@Injectable()
export class KeycloakResourcesService {
  private configService: EnvService;

  private readonly logger = new Logger(KeycloakResourcesService.name);
  private readonly kcAdminClient;
  private readonly realm: string;

  constructor(configService: EnvService) {
    this.configService = configService;
    this.kcAdminClient = new KcAdminClient({
      baseUrl: this.configService.get("OPEN_DPP_KEYCLOAK_URL"),
    });
    this.realm = this.configService.get("OPEN_DPP_KEYCLOAK_REALM") as string;
  }

  async reloadToken() {
    await this.kcAdminClient.auth({
      grantType: "password",
      clientId: "admin-cli",
      username: this.configService.get("OPEN_DPP_KEYCLOAK_USER"),
      password: this.configService.get("OPEN_DPP_KEYCLOAK_PASSWORD"),
    });
  }

  async getUsers() {
    await this.reloadToken();
    return this.kcAdminClient.users.find({ realm: this.realm });
  }

  async findKeycloakUserByEmail(email: string) {
    await this.reloadToken();
    const users = await this.kcAdminClient.users.find({
      realm: this.realm,
      email,
    });
    if (users.length === 0) {
      return null;
    }
    else if (users.length > 1) {
      this.logger.warn("More than one user found for email");
    }
    return users[0];
  }
}
