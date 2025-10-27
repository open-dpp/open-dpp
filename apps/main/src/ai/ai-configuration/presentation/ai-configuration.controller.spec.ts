import { randomUUID } from "node:crypto";
import { INestApplication } from "@nestjs/common";
import { APP_GUARD, Reflector } from "@nestjs/core";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule } from "@open-dpp/env";
import { NotFoundInDatabaseExceptionFilter } from "@open-dpp/exception";
import {
  getApp,
  MongooseTestingModule,
} from "@open-dpp/testing";
import { Connection } from "mongoose";
import request from "supertest";
import { BetterAuthTestingGuard, getBetterAuthToken } from "../../../../test/better-auth-testing.guard";
import TestUsersAndOrganizations from "../../../../test/test-users-and-orgs";
import { AuthService } from "../../../auth/auth.service";
import { EmailService } from "../../../email/email.service";
import { Organization } from "../../../organizations/domain/organization";
import { OrganizationDbSchema, OrganizationDoc } from "../../../organizations/infrastructure/organization.schema";
import { OrganizationsService } from "../../../organizations/infrastructure/organizations.service";
import { User } from "../../../users/domain/user";
import { UsersService } from "../../../users/infrastructure/users.service";
import { AiConfiguration, AiProvider } from "../domain/ai-configuration";
import { aiConfigurationFactory } from "../fixtures/ai-configuration-props.factory";
import {
  AiConfigurationDbSchema,
  AiConfigurationDoc,
} from "../infrastructure/ai-configuration.schema";
import { AiConfigurationService } from "../infrastructure/ai-configuration.service";
import { AiConfigurationController } from "./ai-configuration.controller";
import { aiConfigurationToDto } from "./dto/ai-configuration.dto";

describe("aiConfigurationController", () => {
  let app: INestApplication;
  const reflector: Reflector = new Reflector();
  const betterAuthTestingGuard = new BetterAuthTestingGuard(reflector);
  betterAuthTestingGuard.loadUsers([TestUsersAndOrganizations.users.user1, TestUsersAndOrganizations.users.user2]);

  let mongoConnection: Connection;
  let module: TestingModule;
  let aiConfigurationService: AiConfigurationService;
  let organizationService: OrganizationsService;

  const mockNow = new Date("2025-01-01T12:00:00Z");

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseTestingModule,
        MongooseModule.forFeature([
          {
            name: AiConfigurationDoc.name,
            schema: AiConfigurationDbSchema,
          },
          {
            name: OrganizationDoc.name,
            schema: OrganizationDbSchema,
          },
        ]),
      ],
      providers: [
        OrganizationsService,
        UsersService,
        AiConfigurationService,
        {
          provide: EmailService,
          useValue: {
            send: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            getSession: jest.fn(),
            getUserById: jest.fn(),
          },
        },
        {
          provide: APP_GUARD,
          useValue: betterAuthTestingGuard,
        },
      ],
      controllers: [AiConfigurationController],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalFilters(new NotFoundInDatabaseExceptionFilter());
    mongoConnection = module.get(getConnectionToken());
    aiConfigurationService = module.get(AiConfigurationService);
    organizationService = module.get(OrganizationsService);

    await app.init();

    await organizationService.save(TestUsersAndOrganizations.organizations.org1);
    await organizationService.save(TestUsersAndOrganizations.organizations.org2);
  });
  beforeEach(() => {
    jest.spyOn(Date, "now").mockImplementation(() => mockNow.getTime());
    jest.spyOn(reflector, "get").mockReturnValue(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it(`/PUT create configuration`, async () => {
    const body = {
      isEnabled: true,
      provider: AiProvider.Mistral,
      model: "codestral-latest",
    };
    const response = await request(getApp(app))
      .put(`/organizations/${TestUsersAndOrganizations.organizations.org1.id}/configurations`)
      .set(
        "Authorization",
        getBetterAuthToken(
          TestUsersAndOrganizations.users.user1.id,
        ),
      )
      .send(body);
    expect(response.status).toEqual(200);
    const found
      = await aiConfigurationService.findOneByOrganizationIdOrFail(TestUsersAndOrganizations.organizations.org1.id);
    expect(found).toBeDefined();
    expect(found.isEnabled).toEqual(body.isEnabled);
    expect(found.provider).toEqual(body.provider);
    expect(found.model).toEqual(body.model);
  });

  it(`/PUT create configuration fails if user is no member of organization`, async () => {
    const body = {
      isEnabled: true,
      provider: AiProvider.Mistral,
      model: "codestral-latest",
    };
    const response = await request(app.getHttpServer())
      .put(`/organizations/${TestUsersAndOrganizations.organizations.org2.id}/configurations`)
      .set(
        "Authorization",
        getBetterAuthToken(
          TestUsersAndOrganizations.users.user1.id,
        ),
      )
      .send(body);
    expect(response.status).toEqual(403);
  });

  it(`/PUT update configuration`, async () => {
    const userTemp = User.create({
      email: `${randomUUID()}@test.test`,
    });
    const orgTemp = Organization.create({
      name: `organization-temp-${randomUUID()}`,
      ownedByUserId: userTemp.id,
      createdByUserId: userTemp.id,
      members: [userTemp],
    });
    betterAuthTestingGuard.addUser(userTemp);
    await organizationService.save(orgTemp);
    const configuration = AiConfiguration.loadFromDb(
      aiConfigurationFactory.build({
        ownedByOrganizationId: orgTemp.id,
      }),
    );
    const { id } = await aiConfigurationService.save(configuration);
    const body = {
      isEnabled: false,
      provider: AiProvider.Ollama,
      model: "qwen3:0.6b",
    };
    const response = await request(getApp(app))
      .put(`/organizations/${orgTemp.id}/configurations`)
      .set(
        "Authorization",
        getBetterAuthToken(
          userTemp.id,
        ),
      )
      .send(body);
    expect(response.status).toEqual(200);
    const found
      = await aiConfigurationService.findOneByOrganizationIdOrFail(orgTemp.id);
    expect(found.id).toEqual(id);
    expect(found.isEnabled).toEqual(body.isEnabled);
    expect(found.provider).toEqual(body.provider);
    expect(found.model).toEqual(body.model);
  });

  it(`/GET find configuration`, async () => {
    const userTemp = User.create({
      email: `${randomUUID()}@test.test`,
    });
    const orgTemp = Organization.create({
      name: `organization-temp-${randomUUID()}`,
      ownedByUserId: userTemp.id,
      createdByUserId: userTemp.id,
      members: [userTemp],
    });
    betterAuthTestingGuard.addUser(userTemp);
    await organizationService.save(orgTemp);
    const aiConfiguration = AiConfiguration.loadFromDb(
      aiConfigurationFactory.build({ ownedByOrganizationId: orgTemp.id }),
    );
    await aiConfigurationService.save(aiConfiguration);
    const response = await request(getApp(app))
      .get(`/organizations/${orgTemp.id}/configurations`)
      .set(
        "Authorization",
        getBetterAuthToken(
          userTemp.id,
        ),
      );
    expect(response.status).toEqual(200);
    expect(response.body).toEqual(aiConfigurationToDto(aiConfiguration));
  });

  it(`/GET find configuration fails if user is no member of organization`, async () => {
    const aiConfiguration = AiConfiguration.loadFromDb(
      aiConfigurationFactory.build({ ownedByOrganizationId: TestUsersAndOrganizations.organizations.org2.id }),
    );
    await aiConfigurationService.save(aiConfiguration);
    const response = await request(getApp(app))
      .get(`/organizations/${TestUsersAndOrganizations.organizations.org2.id}/configurations`)
      .set(
        "Authorization",
        getBetterAuthToken(
          TestUsersAndOrganizations.users.user1.id,
        ),
      );
    expect(response.status).toEqual(403);
  });

  it(`/GET cannot find configuration`, async () => {
    const response = await request(getApp(app))
      .get(`/organizations/${randomUUID()}/configurations`)
      .set(
        "Authorization",
        getBetterAuthToken(
          TestUsersAndOrganizations.users.user1.id,
        ),
      );
    expect(response.status).toEqual(404);
  });

  afterAll(async () => {
    await mongoConnection.close();
    await module.close();
    await app.close();
  });
});
