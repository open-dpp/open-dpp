import type { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import type { Connection } from "mongoose";
import { randomUUID } from "node:crypto";
import { expect, jest } from "@jest/globals";
import { APP_GUARD } from "@nestjs/core";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { getApp } from "@open-dpp/testing";
import request from "supertest";
import { BetterAuthHelper } from "../../../test/better-auth-helper";
import { AuthGuard } from "../../auth/auth.guard";
import { AuthModule } from "../../auth/auth.module";
import { AuthService } from "../../auth/auth.service";
import { generateMongoConfig } from "../../database/config";
import { EmailService } from "../../email/email.service";
import { PassportTemplatePublication } from "../domain/passport-template-publication";
import { passportTemplatePublicationPropsFactory } from "../fixtures/passport.template.factory";
import {
  PassportTemplatePublicationDbSchema,
  PassportTemplatePublicationDoc,
} from "../infrastructure/passport-template-publication.schema";
import { PassportTemplatePublicationService } from "../infrastructure/passport-template-publication.service";
import { passportTemplatePublicationToDto } from "./dto/passport-template-publication.dto";
import { PassportTemplatePublicationController } from "./passport-template-publication.controller";

describe("passportTemplateController", () => {
  let app: INestApplication;
  let mongoConnection: Connection;
  let module: TestingModule;
  let passportTemplateService: PassportTemplatePublicationService;
  let authService: AuthService;

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
            name: PassportTemplatePublicationDoc.name,
            schema: PassportTemplatePublicationDbSchema,
          },
        ]),
        AuthModule,
      ],
      providers: [
        PassportTemplatePublicationService,
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
      ],
      controllers: [PassportTemplatePublicationController],
    }).overrideProvider(EmailService).useValue({
      send: jest.fn(),
    }).compile();

    app = module.createNestApplication();
    mongoConnection = module.get(getConnectionToken());
    passportTemplateService = module.get(PassportTemplatePublicationService);
    authService = module.get<AuthService>(
      AuthService,
    );
    betterAuthHelper.setAuthService(authService);

    await app.init();

    const user1data = await betterAuthHelper.createUser();
    await betterAuthHelper.createOrganization(user1data?.user.id as string);
    const user2data = await betterAuthHelper.createUser();
    await betterAuthHelper.createOrganization(user2data?.user.id as string);
  });
  beforeEach(() => {
    jest.spyOn(Date, "now").mockImplementation(() => mockNow.getTime());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it(`/GET find all passport templates`, async () => {
    const { org, user } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();
    const passportTemplate = PassportTemplatePublication.loadFromDb(
      passportTemplatePublicationPropsFactory.build({ ownedByOrganizationId: org.id, createdByUserId: user.id }),
    );
    const passportTemplate2 = PassportTemplatePublication.loadFromDb(
      passportTemplatePublicationPropsFactory.build({ id: randomUUID(), ownedByOrganizationId: org.id, createdByUserId: user.id }),
    );

    await passportTemplateService.save(passportTemplate);
    await passportTemplateService.save(passportTemplate2);
    const response = await request(getApp(app)).get(`/templates/passports`);
    expect(response.status).toEqual(200);
    expect(response.body).toContainEqual(
      passportTemplatePublicationToDto(passportTemplate),
    );
    expect(response.body).toContainEqual(
      passportTemplatePublicationToDto(passportTemplate2),
    );
  });

  afterAll(async () => {
    await module.close();
    await mongoConnection.destroy();
    await app.close();
  });
});
