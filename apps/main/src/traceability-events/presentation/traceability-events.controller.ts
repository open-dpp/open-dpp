import type * as authRequest from '@open-dpp/auth'
import type { TraceabilityEventsService } from '../infrastructure/traceability-events.service'
import { Body, Controller, Get, Param, Post, Request } from '@nestjs/common'

@Controller('dpp-events')
export class TraceabilityEventsController {
  constructor(private readonly dppEventsService: TraceabilityEventsService) {}

  @Post()
  async create(@Body() body: any, @Request() req: authRequest.AuthRequest) {
    return await this.dppEventsService.create({
      ...body,
      userId: req.authContext.keycloakUser.sub,
    })
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return await this.dppEventsService.findById(id)
  }
}
