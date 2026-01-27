import type { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import { jest } from "@jest/globals";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { BetterAuthHelper } from "../../../test/better-auth-helper";
import { AuthGuard } from "../../auth/auth.guard";
import { AuthModule } from "../../auth/auth.module";
import { AuthService } from "../../auth/auth.service";
import { generateMongoConfig } from "../../database/config";
import { EmailService } from "../../email/email.service";

import { MediaDbSchema, MediaDoc } from "../infrastructure/media.schema";
import { MediaService } from "../infrastructure/media.service";
import { MediaController } from "./media.controller";

describe("mediaController", () => {
  let app: INestApplication;
  let module: TestingModule;
  let authService: AuthService;

  const betterAuthHelper = new BetterAuthHelper();
  let controller: MediaController;

  beforeEach(async () => {
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
            name: MediaDoc.name,
            schema: MediaDbSchema,
          },
        ]),
        AuthModule,
      ],
      providers: [
        MediaService,
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
      ],
      controllers: [MediaController],
    }).overrideProvider(EmailService).useValue({
      send: jest.fn(),
    }).compile();

    app = module.createNestApplication();
    controller = module.get<MediaController>(MediaController);
    authService = module.get<AuthService>(
      AuthService,
    );
    betterAuthHelper.setAuthService(authService);

    await app.init();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
    await app.close();
  });
});
