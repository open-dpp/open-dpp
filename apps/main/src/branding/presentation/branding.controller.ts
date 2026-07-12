import type express from "express";
import { readFile } from "node:fs/promises";
import { Body, Controller, Get, Param, Put, Res } from "@nestjs/common";
import { type BrandingDto, BrandingDtoSchema } from "@open-dpp/dto";
import { ZodValidationPipe } from "@open-dpp/exception";
import { AllowAnonymous } from "../../identity/auth/presentation/decorators/allow-anonymous.decorator";
import { OrganizationId } from "../../identity/auth/presentation/decorators/organization-id.decorator";
import { MediaService } from "../../media/infrastructure/media.service";
import { streamMedia } from "../../media/presentation/media-response.util";
import { Branding } from "../domain/branding";
import { BrandingRepository } from "../infrastructure/branding.repository";

@Controller("/branding")
export class BrandingController {
  constructor(
    private readonly brandingRepository: BrandingRepository,
    private readonly mediaService: MediaService,
  ) {}

  @Get()
  async getOrganizationBranding(@OrganizationId() organizationId: string): Promise<BrandingDto> {
    const organizationBranding = (
      await this.brandingRepository.findOneByOrganizationId(organizationId)
    ).toPlain();
    return BrandingDtoSchema.parse(organizationBranding);
  }

  @Put()
  async setOrganizationBranding(
    @OrganizationId() organizationId: string,
    @Body(new ZodValidationPipe(BrandingDtoSchema)) branding: BrandingDto,
  ): Promise<BrandingDto> {
    return BrandingDtoSchema.parse(
      (await this.brandingRepository.save(Branding.fromPlain(branding, organizationId))).toPlain(),
    );
  }

  @AllowAnonymous()
  @Get("/instance")
  async getInstanceBranding() {
    return BrandingDtoSchema.parse(this.brandingRepository.getDefaultBranding().toPlain());
  }

  @AllowAnonymous()
  @Get("/instance/logo")
  async getInstanceLogo(@Res() response: express.Response) {
    const file = await this.brandingRepository.getInstanceBrandingPath();
    const fileContent = await readFile(file.path);
    response.type(file.filetype);
    return response.send(fileContent);
  }

  /**
   * Public organization logo. The bare `/media/:id` route is authenticated, so this is the
   * one anonymous path to logo bytes — gated so it serves ONLY media that is its owning
   * org's branding logo (`existsByLogoForOrg`), never arbitrary media by id.
   */
  @AllowAnonymous()
  @Get("/logo/:mediaId")
  async getOrganizationLogo(
    @Param("mediaId") mediaId: string,
    @Res() res: express.Response,
  ): Promise<void> {
    try {
      const media = await this.mediaService.findOneOrFail(mediaId);
      const isLogo = await this.brandingRepository.isOrganizationLogo(
        mediaId,
        media.ownedByOrganizationId,
      );
      // A logo is always an image — refuse anything else even if mis-assigned, so a non-image
      // passport file can never be exposed publicly through this route.
      if (!isLogo || !media.mimeType.startsWith("image/")) {
        res.status(404).json({ error: "Logo not found" });
        return;
      }
      const stream = await this.mediaService.getFilestreamOfMedia(media);
      streamMedia(res, media, stream);
    } catch {
      res.status(404).json({ error: "Logo not found" });
    }
  }
}
