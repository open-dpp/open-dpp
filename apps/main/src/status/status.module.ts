import { Module } from "@nestjs/common";
import { StatusService } from "./application/services/status.service";
import { StatusController } from "./presentation/status.controller";

@Module({
  controllers: [StatusController],
  providers: [StatusService],
})
export class StatusModule {}
