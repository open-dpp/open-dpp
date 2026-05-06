import { Controller, Get, HttpStatus, Logger, Query, Redirect } from "@nestjs/common";
import { EnvService } from "@open-dpp/env";
import { AllowAnonymous } from "../../auth/presentation/decorators/allow-anonymous.decorator";
import { EmailChangeRequestsService } from "../application/services/email-change-requests.service";
import { verifyRevokeToken } from "../domain/revoke-token";

@Controller("users/email-change")
export class RevokeEmailChangeController {
  private readonly logger = new Logger(RevokeEmailChangeController.name);

  constructor(
    private readonly emailChangeRequestsService: EmailChangeRequestsService,
    private readonly envService: EnvService,
  ) {}

  @Get("revoke")
  @AllowAnonymous()
  @Redirect()
  async revoke(@Query("token") token: string): Promise<{ url: string; statusCode: number }> {
    const baseUrl = this.envService.get("OPEN_DPP_URL");
    const okUrl = `${baseUrl}/account/email-change-revoked?status=ok`;
    const invalidUrl = `${baseUrl}/account/email-change-revoked?status=invalid`;

    if (!token) {
      return { url: invalidUrl, statusCode: HttpStatus.FOUND };
    }

    try {
      const payload = verifyRevokeToken(token, this.envService.get("OPEN_DPP_AUTH_SECRET"));
      const existing = await this.emailChangeRequestsService.findByUserId(payload.userId);
      if (existing && existing.id === payload.requestId) {
        await this.emailChangeRequestsService.hardCancel(payload.userId);
      } else {
        this.logger.log(
          `revoke: idempotent no-op for user ${payload.userId} (token requestId ${payload.requestId})`,
        );
      }
      return { url: okUrl, statusCode: HttpStatus.FOUND };
    } catch (error) {
      this.logger.warn(`revoke: invalid token`, error);
      return { url: invalidUrl, statusCode: HttpStatus.FOUND };
    }
  }
}
