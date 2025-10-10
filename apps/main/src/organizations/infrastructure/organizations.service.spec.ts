import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import {
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AuthContext, PermissionModule } from "@open-dpp/auth";
import { EnvModule } from "@open-dpp/env";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { createKeycloakUserInToken, KeycloakResourcesServiceTesting } from "@open-dpp/testing";
import { v4 as uuid4 } from "uuid";
import { KeycloakResourcesService } from "../../keycloak-resources/infrastructure/keycloak-resources.service";
import { User } from "../../users/domain/user";
import { UsersService } from "../../users/infrastructure/users.service";
import { Organization } from "../domain/organization";
import { OrganizationsService } from "./organizations.service";

describe("organizationsService", () => {
  let organizationsService: OrganizationsService;
  let usersService: UsersService;
  let keycloakResourcesService: KeycloakResourcesServiceTesting;
  const authContext = new AuthContext();
  authContext.keycloakUser = createKeycloakUserInToken();
  const user = User.loadFromDb({
    id: authContext.keycloakUser.sub,
    email: authContext.keycloakUser.email,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        PermissionModule,
      ],
      providers: [OrganizationsService, UsersService, KeycloakResourcesService],
    })
      .overrideProvider(KeycloakResourcesService)
      .useValue(
        KeycloakResourcesServiceTesting.fromPlain({
          users: [
            { id: user.id, email: user.email },
            { id: randomUUID(), email: "other@test.test" },
          ],
        }),
      )
      .overrideProvider(UsersService)
      .useValue({
        find: jest.fn(),
        findOne: jest.fn(),
        convertToDomain: jest.fn(entity => User.loadFromDb({
          id: entity.id,
          email: entity.email,
        })),
      })
      .compile();

    organizationsService
      = module.get<OrganizationsService>(OrganizationsService);
    usersService = module.get<UsersService>(UsersService);
    keycloakResourcesService = module.get<KeycloakResourcesService>(
      KeycloakResourcesService,
    ) as unknown as KeycloakResourcesServiceTesting;
  });
});
