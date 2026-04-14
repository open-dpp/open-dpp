import type express from "express";
import { readFile } from "node:fs/promises";
import { Controller, Get, Res } from "@nestjs/common";
import { BrandingDto, BrandingDtoSchema } from "@open-dpp/dto";
import { AllowAnonymous } from "../../identity/auth/presentation/decorators/allow-anonymous.decorator";
import { OrganizationId } from "../../identity/auth/presentation/decorators/organization-id.decorator";
import { BrandingRepository } from "../infrastructure/branding.repository";

@Controller("/branding")
export class BrandingController {
  constructor(private readonly brandingRepository: BrandingRepository) {}

  @Get()
  async getOrganizationBranding(@OrganizationId() organizationId: string): Promise<BrandingDto> {
    return BrandingDtoSchema.parse(
      (await this.brandingRepository.findOneByOrganizationId(organizationId)).toPlain(),
    );
  }

  @AllowAnonymous()
  @Get("/instance")
  async getInstanceBranding(@Res() response: express.Response) {
    const file = await this.brandingRepository.getInstanceBrandingPath();
    const fileContent = await readFile(file.path);
    response.type(file.filetype);
    return response.send(fileContent);
  }
}
