import type express from "express";
import { readFile } from "node:fs/promises";
import { Controller, ForbiddenException, Get, Res } from "@nestjs/common";
import { BrandingDto, BrandingDtoSchema } from "@open-dpp/dto";
import { Session } from "../../identity/auth/domain/session";
import { AllowAnonymous } from "../../identity/auth/presentation/decorators/allow-anonymous.decorator";
import { AuthSession } from "../../identity/auth/presentation/decorators/auth-session.decorator";
import { BrandingRepository } from "../infrastructure/branding.repository";

@Controller("/branding")
export class BrandingController {
  constructor(
    private readonly brandingRepository: BrandingRepository,
  ) {
  }

  @Get()
  async getOrganizationBranding(
    @AuthSession() session: Session,
  ): Promise<BrandingDto> {
    if (!session.activeOrganizationId) {
      throw new ForbiddenException("No active organization selected");
    }

    return BrandingDtoSchema.parse((await this.brandingRepository.findOneByOrganizationId(session.activeOrganizationId)).toPlain());
  }

  @AllowAnonymous()
  @Get("/instance")
  async getInstanceBranding(
    @Res() response: express.Response,
  ) {
    const file = await this.brandingRepository.getInstanceBrandingPath();
    const fileContent = await readFile(file.path);
    response.type(file.filetype);
    return response.send(fileContent);
  }
}
