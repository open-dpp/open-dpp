import type { TestingModule } from "@nestjs/testing";
import { expect } from "@jest/globals";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { MongooseTestingModule } from "@open-dpp/testing";
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
        MongooseTestingModule,
        MongooseModule.forFeature([
          {
            name: TraceabilityEventDocument.name,
            schema: DppEventSchema,
          },
        ]),
      ],
      controllers: [TraceabilityEventsController],
      providers: [TraceabilityEventsService],
    }).compile();

    controller = module.get<TraceabilityEventsController>(
      TraceabilityEventsController,
    );
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
