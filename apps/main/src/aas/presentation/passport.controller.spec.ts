import type { INestApplication } from "@nestjs/common";
import { expect, jest } from "@jest/globals";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";

import request from "supertest";
import { BetterAuthHelper } from "../../../test/better-auth-helper";
import { AuthGuard } from "../../auth/auth.guard";
import { AuthModule } from "../../auth/auth.module";
import { AuthService } from "../../auth/auth.service";
import { generateMongoConfig } from "../../database/config";
import { EmailService } from "../../email/email.service";
import { AasModule } from "../aas.module";
import { PassportDoc, PassportSchema } from "../infrastructure/schemas/passport.schema";
import { PassportController } from "./passport.controller";

describe("passportController", () => {
  let app: INestApplication;
  let authService: AuthService;

  const betterAuthHelper = new BetterAuthHelper();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
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
            name: PassportDoc.name,
            schema: PassportSchema,
          },
        ]),
        AuthModule,
        AasModule,
      ],
      providers: [
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
      ],
      controllers: [PassportController],
    }).overrideProvider(EmailService).useValue({
      send: jest.fn(),
    }).compile();

    authService = moduleRef.get<AuthService>(
      AuthService,
    );
    betterAuthHelper.setAuthService(authService);

    app = moduleRef.createNestApplication();
    await app.init();

    const user1data = await betterAuthHelper.createUser();
    await betterAuthHelper.createOrganization(user1data?.user.id as string);
    const user2data = await betterAuthHelper.createUser();
    await betterAuthHelper.createOrganization(user2data?.user.id as string);
  });

  it(`/GET submodels`, async () => {
    const { org, userCookie } = await betterAuthHelper.getRandomOrganizationAndUserWithCookie();

    const response = await request(app.getHttpServer())
      .get(`/organizations/${org.id}/passports/8/submodels`)
      .set("Cookie", userCookie)
      .send();
    expect(response.status).toEqual(200);
  });

  afterAll(async () => {
    await app.close();
  });
});
