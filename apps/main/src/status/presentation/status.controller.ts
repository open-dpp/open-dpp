import { Controller, Get } from "@nestjs/common";
import { AllowAnonymous } from "../../identity/auth/presentation/decorators/allow-anonymous.decorator";
import { StatusService } from "../application/services/status.service";

@Controller("status")
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @AllowAnonymous()
  @Get()
  getStatus() {
    return this.statusService.getStatus().toPlain();
  }
}
