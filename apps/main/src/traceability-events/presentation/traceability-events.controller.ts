import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { Session } from "../../identity/auth/domain/session";
import { AuthSession } from "../../identity/auth/presentation/decorators/auth-session.decorator";
import { TraceabilityEventsService } from "../infrastructure/traceability-events.service";

@Controller("dpp-events")
export class TraceabilityEventsController {
  private readonly dppEventsService: TraceabilityEventsService;

  constructor(dppEventsService: TraceabilityEventsService) {
    this.dppEventsService = dppEventsService;
  }

  @Post()
  async create(@Body() body: any, @AuthSession() session: Session) {
    return await this.dppEventsService.create({
      ...body,
      userId: session.userId,
    });
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    return await this.dppEventsService.findById(id);
  }
}
