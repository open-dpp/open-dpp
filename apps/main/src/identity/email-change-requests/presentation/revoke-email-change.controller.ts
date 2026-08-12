import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Post, Query } from "@nestjs/common";
import { EnvService } from "@open-dpp/env";
import { ZodValidationPipe } from "@open-dpp/exception";
import { z } from "zod";
import { AllowAnonymous } from "../../auth/presentation/decorators/allow-anonymous.decorator";
import { EmailChangeRequestsService } from "../application/services/email-change-requests.service";
import { type RevokeTokenPayload, verifyRevokeToken } from "../domain/revoke-token";

const RevokeEmailChangeBodySchema = z.object({ token: z.string() });
type RevokeEmailChangeBody = z.infer<typeof RevokeEmailChangeBodySchema>;

export interface RevokeResult {
  status: "ok" | "invalid" | "error";
}

export interface RevokeInfo {
  valid: boolean;
  newEmail?: string;
}

@Controller("users/email-change")
export class RevokeEmailChangeController {
  private readonly logger = new Logger(RevokeEmailChangeController.name);

  constructor(
    private readonly emailChangeRequestsService: EmailChangeRequestsService,
    private readonly envService: EnvService,
  ) {}

  // State-changing revoke. Must be a POST (not a prefetchable GET) so enterprise
  // mail link-scanners (Outlook SafeLinks, AV gateways) cannot auto-cancel a
  // legitimate pending email change by merely fetching the link.
  @Post("revoke")
  @HttpCode(HttpStatus.OK)
  @AllowAnonymous()
  async revoke(
    @Body(new ZodValidationPipe(RevokeEmailChangeBodySchema)) body: RevokeEmailChangeBody,
  ): Promise<RevokeResult> {
    const token = body.token;
    if (!token) {
      return { status: "invalid" };
    }

    let payload: RevokeTokenPayload;
    try {
      payload = verifyRevokeToken(token, this.envService.get("OPEN_DPP_AUTH_SECRET"));
    } catch (error) {
      this.logger.warn(`revoke: invalid token`, error);
      return { status: "invalid" };
    }

    try {
      const existing = await this.emailChangeRequestsService.findByUserId(payload.userId);
      if (existing && existing.id === payload.requestId) {
        await this.emailChangeRequestsService.hardCancel(payload.userId);
      } else {
        this.logger.log(
          `revoke: idempotent no-op for user ${payload.userId} (token requestId ${payload.requestId})`,
        );
      }
      return { status: "ok" };
    } catch (error) {
      this.logger.error(`revoke: failed to revoke email change for user ${payload.userId}`, error);
      return { status: "error" };
    }
  }

  // Side-effect-free context lookup for the confirmation page. Safe to prefetch:
  // it never mutates state, it only confirms the token and (when it matches a
  // pending request) returns the target email so the page can show context.
  @Get("revoke/info")
  @AllowAnonymous()
  async revokeInfo(@Query("token") token: string): Promise<RevokeInfo> {
    if (!token) {
      return { valid: false };
    }

    let payload: RevokeTokenPayload;
    try {
      payload = verifyRevokeToken(token, this.envService.get("OPEN_DPP_AUTH_SECRET"));
    } catch (error) {
      this.logger.warn(`revoke-info: invalid token`, error);
      return { valid: false };
    }

    try {
      const existing = await this.emailChangeRequestsService.findByUserId(payload.userId);
      if (existing && existing.id === payload.requestId) {
        return { valid: true, newEmail: existing.newEmail };
      }
      return { valid: true };
    } catch (error) {
      this.logger.error(
        `revoke-info: failed to load email change for user ${payload.userId}`,
        error,
      );
      return { valid: false };
    }
  }
}
