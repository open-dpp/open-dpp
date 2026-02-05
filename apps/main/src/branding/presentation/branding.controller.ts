import type express from "express";
import { Controller, ForbiddenException, Get, UnauthorizedException } from "@nestjs/common";

import { fromNodeHeaders } from "better-auth/node";
import { RequestParam } from "../../aas/presentation/aas.decorators";
import { AuthService } from "../../auth/auth.service";

@Controller("/branding")
export class BrandingController {
  constructor(
    private readonly authService: AuthService,
  ) {
  }

  @Get()
  async getBranding(
    @RequestParam() req: express.Request,
  ): Promise<{ logo: string }> {
    const session = await this.authService.getSession(fromNodeHeaders(req.headers || []));
    if (!session?.user) {
      throw new UnauthorizedException("User is not logged in");
    }

    const activeOrganization = await this.authService.getActiveOrganization(session.user.id);
    if (!activeOrganization) {
      throw new ForbiddenException("User is not part of any organization");
    }

    return { logo: activeOrganization.image ?? "" };
  }
}
