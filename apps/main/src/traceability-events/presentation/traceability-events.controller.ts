import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { UserSession } from "../../auth/auth.guard";
import { Session } from "../../auth/session.decorator";
import { TraceabilityEventsService } from "../infrastructure/traceability-events.service";

@Controller("dpp-events")
export class TraceabilityEventsController {
  private readonly dppEventsService: TraceabilityEventsService;

  constructor(dppEventsService: TraceabilityEventsService) {
    this.dppEventsService = dppEventsService;
  }

  @Post()
  async create(@Body() body: any, @Session() session: UserSession) {
    return await this.dppEventsService.create({
      ...body,
      userId: session.user.id,
    });
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    return await this.dppEventsService.findById(id);
  }
}
