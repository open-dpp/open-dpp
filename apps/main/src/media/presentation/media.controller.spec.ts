import type { TestingModule } from "@nestjs/testing";
import { expect, jest } from "@jest/globals";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { AuthGuard } from "../../auth/auth.guard";
import { AuthModule } from "../../auth/auth.module";
import { generateMongoConfig } from "../../database/config";
import { EmailService } from "../../email/email.service";
import { MediaDbSchema, MediaDoc } from "../infrastructure/media.schema";
import { MediaService } from "../infrastructure/media.service";
import { MediaController } from "./media.controller";

describe("mediaController", () => {
  let controller: MediaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

    controller = module.get<MediaController>(MediaController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
