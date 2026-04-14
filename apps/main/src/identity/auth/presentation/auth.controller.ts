import type { Auth } from "better-auth";
import type express from "express";
import { Controller, ForbiddenException, Get, Inject, Post, Req, Res } from "@nestjs/common";
import { toNodeHandler } from "better-auth/node";
import { InstanceSettingsService } from "../../../instance-settings/application/services/instance-settings.service";
import { AUTH } from "../auth.provider";
import { OptionalAuth } from "./decorators/optional-auth.decorator";

@Controller("auth")
export class AuthController {
  constructor(
    @Inject(AUTH) private readonly auth: Auth,
    private readonly instanceSettingsService: InstanceSettingsService,
  ) {}

  @Post("*path")
  @OptionalAuth()
  async handleBetterAuthPostRequest(
    @Req() request: express.Request,
    @Res() response: express.Response,
  ) {
    if (request.url.includes("/sign-up/email")) {
      const settings = await this.instanceSettingsService.getSettings();
      if (!settings.signupEnabled.value) {
        throw new ForbiddenException("Signup is disabled");
      }
    }
    const handler = toNodeHandler(this.auth!);
    await handler(request, response);
  }

  @Get("*path")
  @OptionalAuth()
  async handleBetterAuthGetRequest(
    @Req() request: express.Request,
    @Res() response: express.Response,
  ) {
    const handler = toNodeHandler(this.auth!);
    await handler(request, response);
  }
}
