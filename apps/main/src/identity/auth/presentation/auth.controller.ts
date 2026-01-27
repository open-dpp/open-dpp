import type express from "express";
import { Controller, ForbiddenException, Get, Param, Post, Req, Res } from "@nestjs/common";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { AuthService } from "./auth.service";
import { OptionalAuth } from "./optional-auth.decorator";
import { AuthService } from "../application/services/auth.service";
import { OptionalAuth } from "./decorators/optional-auth.decorator";

@Controller("auth")
export class AuthController {
  private readonly authService: AuthService;

  constructor(
    authService: AuthService,
  ) {
    this.authService = authService;
  }

  // Returns the organization name if and only if the current user has an open invitation
  // Otherwise responds with 403 to avoid leaking existence of organizations
  @Get("organization/:organizationId/name")
  @OptionalAuth()
  async getOrganizationNameIfInvited(
    @Param("organizationId") organizationId: string,
    @Req() request: express.Request,
  ) {
    const session = await this.authService.getSession(fromNodeHeaders(request.headers || []));
    const userEmail = session?.user?.email;

    if (!userEmail) {
      throw new ForbiddenException();
    }

    const name = await this.authService.getOrganizationNameIfUserInvited(organizationId, userEmail);
    if (!name) {
      throw new ForbiddenException();
    }

    return { name };
  }

  // Returns all organizations for admin users
  // Otherwise responds with 403
  @Get("organizations")
  async getOrganizations(
    @Req() request: express.Request,
  ) {
    const session = await this.authService.getSession(fromNodeHeaders(request.headers || []));

    if (!session || !session.user) {
      throw new ForbiddenException();
    }

    const user = session.user as unknown as { role: string };

    if (user.role !== "admin") {
      throw new ForbiddenException();
    }

    return this.authService.getAllOrganizations();
  }

  @Post("*path")
  @OptionalAuth()
  async handleBetterAuthPostRequest(
    @Req() request: express.Request,
    @Res() response: express.Response,
  ) {
    const handler = toNodeHandler(this.authService.auth!);
    await handler(request, response);
  }

  @Get("*path")
  @OptionalAuth()
  async handleBetterAuthGetRequest(
    @Req() request: express.Request,
    @Res() response: express.Response,
  ) {
    const handler = toNodeHandler(this.authService.auth!);
    await handler(request, response);
  }
}
