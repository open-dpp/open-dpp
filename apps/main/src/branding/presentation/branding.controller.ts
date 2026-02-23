import { Controller, Get } from "@nestjs/common";

import { BrandingDto, BrandingDtoSchema } from "@open-dpp/dto";
import { Session } from "../../identity/auth/domain/session";
import { AuthSession } from "../../identity/auth/presentation/decorators/auth-session.decorator";
import { BrandingRepository } from "../infrastructure/branding.repository";

@Controller("/branding")
export class BrandingController {
  constructor(
    private readonly brandingRepository: BrandingRepository,
  ) {
  }

  @Get()
  async getBranding(
    @AuthSession() session: Session,
  ): Promise<BrandingDto> {
    return BrandingDtoSchema.parse((await this.brandingRepository.findOneByActiveOrganizationId(session)).toPlain());
  }
}
