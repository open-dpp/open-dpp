import { ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { fromNodeHeaders } from "better-auth/node";
import express from "express";
import { AuthService } from "../../auth/auth.service";
import { Branding } from "../domain/branding";

@Injectable()
export class BrandingRepository {
  constructor(
    private readonly authService: AuthService,
  ) {
  }

  async findOneByActiveOrganization(req: express.Request) {
    const session = await this.authService.getSession(fromNodeHeaders(req.headers || []));
    if (!session?.user) {
      throw new UnauthorizedException("User is not logged in");
    }
    const activeOrganization = await this.authService.getActiveOrganization(session.user.id);
    if (!activeOrganization) {
      throw new ForbiddenException("User is not part of any organization");
    }

    return Branding.fromPlain({ logo: activeOrganization.image ?? null });
  }
}
