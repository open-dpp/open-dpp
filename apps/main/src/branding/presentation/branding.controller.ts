import type express from "express";
import { Controller, Get } from "@nestjs/common";

import { BrandingDto, BrandingDtoSchema } from "@open-dpp/dto";
import { RequestParam } from "../../aas/presentation/aas.decorators";
import { BrandingRepository } from "../infrastructure/branding.repository";

@Controller("/branding")
export class BrandingController {
  constructor(
    private readonly brandingRepository: BrandingRepository,
  ) {
  }

  @Get()
  async getBranding(
    @RequestParam() req: express.Request,
  ): Promise<BrandingDto> {
    return BrandingDtoSchema.parse((await this.brandingRepository.findOneByActiveOrganization(req)).toPlain());
  }
}
