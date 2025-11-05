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
import {
  DppEventSchema,
  TraceabilityEventDocument,
} from "../infrastructure/traceability-event.document";
import { TraceabilityEventsService } from "../infrastructure/traceability-events.service";
import { TraceabilityEventsController } from "./traceability-events.controller";

describe("dppEventsController", () => {
  let controller: TraceabilityEventsController;

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
            name: TraceabilityEventDocument.name,
            schema: DppEventSchema,
          },
        ]),
        AuthModule,
      ],
      controllers: [TraceabilityEventsController],
      providers: [
        TraceabilityEventsService,
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
      ],
    }).overrideProvider(EmailService).useValue({
      send: jest.fn(),
    }).compile();

    controller = module.get<TraceabilityEventsController>(
      TraceabilityEventsController,
    );
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
