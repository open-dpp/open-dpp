import { randomUUID } from "node:crypto";
import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { EnvService } from "@open-dpp/env";
import { AuthService } from "./auth.service";

@Injectable()
export class KeycloakSyncOnStartupService implements OnApplicationBootstrap {
  private readonly logger = new Logger(KeycloakSyncOnStartupService.name);
  private readonly configService: EnvService;
  private readonly authService: AuthService;

  constructor(
    configService: EnvService,
    authService: AuthService,
  ) {
    this.configService = configService;
    this.authService = authService;
  }

  async onApplicationBootstrap() {
    const { default: KcAdminClient } = await import("@keycloak/keycloak-admin-client");

    const isTestNodeEnv = this.configService.get("NODE_ENV") === "test";
    if (isTestNodeEnv) {
      return;
    }
    const migrationEnabled = !!this.configService.get("OPEN_DPP_MIGRATE_KEYCLOAK_ENABLED");
    const baseUrl = this.configService.get("OPEN_DPP_MIGRATE_KEYCLOAK_BASEURL");
    const realm = this.configService.get("OPEN_DPP_MIGRATE_KEYCLOAK_REALM");
    const clientId = this.configService.get("OPEN_DPP_MIGRATE_KEYCLOAK_CLIENTID");
    const clientSecret = this.configService.get("OPEN_DPP_MIGRATE_KEYCLOAK_CLIENTSECRET");
    const allSet = baseUrl && realm && clientId && clientSecret;
    if (migrationEnabled && !allSet) {
      throw new Error("Keycloak migration enabled but not all env variables set.");
    }
    if (migrationEnabled && allSet) {
      const client = new KcAdminClient({
        baseUrl,
        realmName: realm,
      });
      await client.auth({
        grantType: "client_credentials",
        clientId,
        clientSecret,
      });
      const users = await client.users.find({ realm });
      for (const user of users) {
        this.logger.log(`Processing user: ${user.username}`);
        const userEmail = user.email;
        if (userEmail) {
          const dbUser = await this.authService.getUserByEmail(user.email as string);
          if (!dbUser) {
            this.logger.log(`User ${user.username} not found in database`);
            const data = await this.authService.auth?.api.signUpEmail({
              body: {
                name: `${user.firstName} ${user.lastName}`,
                email: user.email as string,
                password: randomUUID(),
              },
            });
            await this.authService.setUserEmailVerified(user.email as string, true);
            if (data && data.user) {
              this.logger.log(`User ${user.id}->${data.user.id} created successfully`);
            }
          }
          else {
            this.logger.log(`User with email ${user.email} already found in database`);
          }
        }
        else {
          this.logger.log(`Cannot process user with id ${user.id} without email`);
        }
      }
    }
  }
}
