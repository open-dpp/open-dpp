import type express from "express";
import { readFile } from "node:fs/promises";
import { Body, Controller, Get, Post, Res } from "@nestjs/common";
import { BrandingDto, BrandingDtoSchema } from "@open-dpp/dto";
import { ZodValidationPipe } from "@open-dpp/exception";
import { AllowAnonymous } from "../../identity/auth/presentation/decorators/allow-anonymous.decorator";
import { OrganizationId } from "../../identity/auth/presentation/decorators/organization-id.decorator";
import { Branding } from "../domain/branding";
import { BrandingRepository } from "../infrastructure/branding.repository";

@Controller("/branding")
export class BrandingController {
  constructor(
    private readonly brandingRepository: BrandingRepository,
  ) {
  }

  @Get()
  async getOrganizationBranding(
    @OrganizationId() organizationId: string,
  ): Promise<BrandingDto> {
    const organizationBranding = (await this.brandingRepository.findOneByOrganizationId(organizationId)).toPlain();
    return BrandingDtoSchema.parse(
      organizationBranding,
    );
  }

  @Post()
  async setOrganizationBranding(
    @OrganizationId() organizationId: string,
    @Body(new ZodValidationPipe(BrandingDtoSchema)) branding: BrandingDto,
  ): Promise<BrandingDto> {
    return BrandingDtoSchema.parse((await this.brandingRepository.save(Branding.fromPlain(branding, organizationId))).toPlain());
  }

  @AllowAnonymous()
  @Get("/instance")
  async getInstanceBranding(
  ) {
    return BrandingDtoSchema.parse(this.brandingRepository.getDefaultBranding());
  }

  @AllowAnonymous()
  @Get("/instance/logo")
  async getInstanceLogo(
    @Res() response: express.Response,
  ) {
    const file = await this.brandingRepository.getInstanceBrandingPath();
    const fileContent = await readFile(file.path);
    response.type(file.filetype);
    return response.send(fileContent);
  }
}
