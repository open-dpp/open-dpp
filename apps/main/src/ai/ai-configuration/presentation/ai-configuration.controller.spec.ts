import { jest } from "@jest/globals";
import { INestApplication } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { NotFoundInDatabaseExceptionFilter } from "@open-dpp/exception";
import { Auth } from "better-auth";
import request from "supertest";
import { BetterAuthHelper } from "../../../../test/better-auth-helper";
import {
  getApp,
} from "../../../../test/utils.for.test";
import { generateMongoConfig } from "../../../database/config";
import { EmailService } from "../../../email/email.service";
import { AuthModule } from "../../../identity/auth/auth.module";
import { AUTH } from "../../../identity/auth/auth.provider";
import { AuthGuard } from "../../../identity/auth/infrastructure/guards/auth.guard";
import { UsersService } from "../../../identity/users/application/services/users.service";
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
  let module: TestingModule;
  let aiConfigurationService: AiConfigurationService;

  const betterAuthHelper = new BetterAuthHelper();

  const mockNow = new Date("2025-01-01T12:00:00Z");

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => ({
            ...generateMongoConfig(configService),
          }),
          inject: [EnvService],
        }),
        MongooseModule.forFeature([
          {
            name: AiConfigurationDoc.name,
            schema: AiConfigurationDbSchema,
          },
        ]),
        AuthModule,
      ],
      providers: [
        AiConfigurationService,
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
      ],
      controllers: [AiConfigurationController],
    })
      .overrideProvider(EmailService)
      .useValue({
        send: jest.fn(),
      })
      .compile();

    aiConfigurationService = module.get(AiConfigurationService);
    betterAuthHelper.init(module.get<UsersService>(UsersService), module.get<Auth>(AUTH));

    app = module.createNestApplication();
    app.useGlobalFilters(new NotFoundInDatabaseExceptionFilter());

    await app.init();
    const user1data = await betterAuthHelper.createUser();
    await betterAuthHelper.createOrganization(user1data?.user.id as string);
    const user2data = await betterAuthHelper.createUser();
    await betterAuthHelper.createOrganization(user2data?.user.id as string);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it(`/PUT create configuration`, async () => {
    const { org, userCookie } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const body = {
      isEnabled: true,
      provider: AiProvider.Mistral,
      model: "codestral-latest",
    };
    const response = await request(getApp(app))
      .put(`/organizations/${org.id}/configurations`)
      .set("Cookie", userCookie)
      .send(body);
    expect(response.status).toEqual(200);
    const found
      = await aiConfigurationService.findOneByOrganizationIdOrFail(org.id);
    expect(found).toBeDefined();
    expect(found.isEnabled).toEqual(body.isEnabled);
    expect(found.provider).toEqual(body.provider);
    expect(found.model).toEqual(body.model);
  });

  it(`/PUT create configuration fails if user is no member of organization`, async () => {
    const { userCookie } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const { org: org2 } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const body = {
      isEnabled: true,
      provider: AiProvider.Mistral,
      model: "codestral-latest",
    };
    const response = await request(getApp(app))
      .put(`/organizations/${org2.id}/configurations`)
      .set("Cookie", userCookie)
      .send(body);
    expect(response.status).toEqual(403);
  });

  it(`/PUT update configuration`, async () => {
    const { org, userCookie } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const configuration = AiConfiguration.loadFromDb(
      aiConfigurationFactory.build({
        ownedByOrganizationId: org.id,
      }),
    );
    const { id } = await aiConfigurationService.save(configuration);
    const body = {
      isEnabled: false,
      provider: AiProvider.Ollama,
      model: "qwen3:0.6b",
    };
    const response = await request(getApp(app))
      .put(`/organizations/${org.id}/configurations`)
      .set("Cookie", userCookie)
      .send(body);
    expect(response.status).toEqual(200);
    const found
      = await aiConfigurationService.findOneByOrganizationIdOrFail(org.id);
    expect(found.id).toEqual(id);
    expect(found.isEnabled).toEqual(body.isEnabled);
    expect(found.provider).toEqual(body.provider);
    expect(found.model).toEqual(body.model);
  });

  it(`/GET find configuration`, async () => {
    const { org, userCookie } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    jest.spyOn(Date, "now").mockImplementation(() => mockNow.getTime());
    const aiConfiguration = AiConfiguration.loadFromDb(
      aiConfigurationFactory.build({ ownedByOrganizationId: org.id }),
    );
    await aiConfigurationService.save(aiConfiguration);
    const response = await request(getApp(app))
      .get(`/organizations/${org.id}/configurations`)
      .set("Cookie", userCookie);
    expect(response.status).toEqual(200);
    expect(response.body).toEqual(aiConfigurationToDto(aiConfiguration));
  });

  it(`/GET find configuration fails if user is no member of organization`, async () => {
    const { userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const { org: org2 } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const aiConfiguration = AiConfiguration.loadFromDb(
      aiConfigurationFactory.build({ ownedByOrganizationId: org2.id }),
    );
    await aiConfigurationService.save(aiConfiguration);
    const response = await request(getApp(app))
      .get(`/organizations/${org2.id}/configurations`)
      .set("Cookie", userCookie);
    expect(response.status).toEqual(403);
  });

  it(`/GET cannot find configuration`, async () => {
    const { org, userCookie } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const response = await request(getApp(app))
      .get(`/organizations/${org.id}/configurations`)
      .set("Cookie", userCookie);
    expect(response.status).toEqual(404);
  });

  afterAll(async () => {
    await module.close();
    await app.close();
  });
});
