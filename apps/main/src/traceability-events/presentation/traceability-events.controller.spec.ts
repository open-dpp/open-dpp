import { Test, TestingModule } from '@nestjs/testing';
import { TraceabilityEventsController } from './traceability-events.controller';
import { TraceabilityEventsService } from '../infrastructure/traceability-events.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DppEventSchema,
  TraceabilityEventDocument,
} from '../infrastructure/traceability-event.document';
import { expect } from '@jest/globals';
import { MongooseTestingModule } from '@app/testing/mongo.testing.module';

describe('DppEventsController', () => {
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

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
