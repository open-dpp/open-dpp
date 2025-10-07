import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  DppEventSchema,
  TraceabilityEventDocument,
} from "./infrastructure/traceability-event.document";
import { TraceabilityEventsService } from "./infrastructure/traceability-events.service";
import { TraceabilityEventsController } from "./presentation/traceability-events.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: TraceabilityEventDocument.name,
        schema: DppEventSchema,
      },
    ]),
  ],
  providers: [TraceabilityEventsService],
  controllers: [TraceabilityEventsController],
  exports: [TraceabilityEventsService],
})
export class TraceabilityEventsModule {}
