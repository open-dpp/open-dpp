import type { OnApplicationBootstrap } from "@nestjs/common";
import { Injectable, Logger } from "@nestjs/common";
import { EnvService } from "@open-dpp/env";
import { KeycloakResourcesService } from "../../keycloak-resources/infrastructure/keycloak-resources.service";
import { OrganizationsService } from "../../organizations/infrastructure/organizations.service";
import { UsersService } from "../../users/infrastructure/users.service";

@Injectable()
export class KeycloakSyncOnStartupService implements OnApplicationBootstrap {
  private readonly logger: Logger = new Logger(
    KeycloakSyncOnStartupService.name,
  );

  private readonly usersService: UsersService;
  private readonly keycloakResourcesServices: KeycloakResourcesService;
  private readonly organizationsService: OrganizationsService;
  private readonly configService: EnvService;

  constructor(
    usersService: UsersService,
    keycloakResourcesServices: KeycloakResourcesService,
    organizationsService: OrganizationsService,
    configService: EnvService,
  ) {
    this.usersService = usersService;
    this.keycloakResourcesServices = keycloakResourcesServices;
    this.organizationsService = organizationsService;
    this.configService = configService;
  }

  async onApplicationBootstrap() {
    if (this.configService.get("NODE_ENV") === "test") {
      return;
    }
    await this.sync();
  }

  async sync() {
    this.logger.log("Syncing users from Keycloak to database");
    const keycloakUsers = await this.keycloakResourcesServices.getUsers();
    for (const keycloakUser of keycloakUsers) {
      if (keycloakUser.id && keycloakUser.email && keycloakUser.username) {
        const user = await this.usersService.findOne(keycloakUser.id);
        if (!user) {
          await this.usersService.create(
            {
              sub: keycloakUser.id,
              name: `${keycloakUser.firstName} ${keycloakUser.lastName}`,
              email: keycloakUser.email,
              email_verified: !!keycloakUser.emailVerified,
              preferred_username: keycloakUser.username,
              memberships: [],
            },
            true,
          );
        }
      }
    }
    /* this.logger.log('Syncing users from DB to Keycloak');
    const users = await this.usersService.find();
    for (const user of users) {
      await this.keycloakResourcesServices.createUser(user);
    }
    this.logger.log('Syncing organizations from DB to Keycloak');
    const organizations = await this.organizationsService.findAll();
    for (const organization of organizations) {
      const keycloakGroup =
        await this.keycloakResourcesServices.getGroupForOrganization(
          organization.id,
        );
      if (!keycloakGroup) {
        try {
          await this.keycloakResourcesServices.createGroup(organization);
        } catch (exception) {
          // IGNORE
          console.log(exception);
        }
      }
      for (const member of organization.members) {
        try {
          const authContext = new AuthContext();
          authContext.keycloakUser = {
            sub: organization.createdByUserId,
            email: '',
            name: '',
            preferred_username: '',
            email_verified: true,
          };
          await this.keycloakResourcesServices.inviteUserToGroup(
            authContext,
            organization.id,
            member.id,
          );
        } catch (exception) {
          if (exception.status !== 400) {
            console.warn(exception);
          }
        }
      }
    } */
    this.logger.log("Finished syncing users from Keycloak to database");
  }
}
