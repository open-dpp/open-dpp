import type express from "express";
import type { PublicMediaInfo } from "../../media/presentation/media-response.util";
import type { Passport } from "../../passports/domain/passport";
import { Controller, Get, NotFoundException, Param, Res } from "@nestjs/common";
import { File } from "../../aas/domain/submodel-base/file";
import { ISubmodelElement } from "../../aas/domain/submodel-base/submodel-base";
import { SubmodelRepository } from "../../aas/infrastructure/submodel.repository";
import { AllowAnonymous } from "../../identity/auth/presentation/decorators/allow-anonymous.decorator";
import { MediaService } from "../../media/infrastructure/media.service";
import { streamMedia, toPublicMediaInfo } from "../../media/presentation/media-response.util";
import { PermalinkApplicationService } from "../application/services/permalink.application.service";

/** Recursively collect every `File` element's `value` (a mediaId) under the given elements. */
function collectFileMediaIds(elements: ISubmodelElement[], acc: Set<string>): void {
  for (const element of elements) {
    if (element instanceof File && element.value) {
      acc.add(element.value);
    }
    collectFileMediaIds(element.getSubmodelElements(), acc);
  }
}

/**
 * Public, permalink-gated media access (ADR 0006, Design C).
 *
 * Media is reachable anonymously ONLY through a permalink, exactly like the rest of a
 * passport's data: resolving the permalink applies the publish/ownership gate
 * (`resolveToPassport`), and the requested media must be one of that passport's
 * File-element values (the mediaId IS the passport↔media link — no denormalized field).
 * So a deactivated/unpublished permalink 404s, and one passport's permalink cannot pull
 * a media that the passport does not reference (no cross-passport IDOR). Many-to-many:
 * a media shown on several passports is reachable through each of their permalinks.
 *
 * Routes are 5/6-segment (`media/permalink/:idOrSlug/by-id/:mediaId/...`) and never
 * collide with the bare `media/:id/...` routes.
 */
@Controller("media")
export class MediaPermalinkController {
  constructor(
    private readonly permalinkApplicationService: PermalinkApplicationService,
    private readonly mediaService: MediaService,
    private readonly submodelRepository: SubmodelRepository,
  ) {}

  @Get("permalink/:permalinkIdOrSlug/by-id/:mediaId/info")
  @AllowAnonymous()
  async getInfo(
    @Param("permalinkIdOrSlug") permalinkIdOrSlug: string,
    @Param("mediaId") mediaId: string,
  ): Promise<PublicMediaInfo> {
    await this.assertReferencedOr404(permalinkIdOrSlug, mediaId);
    return toPublicMediaInfo(await this.mediaService.findOneOrFail(mediaId));
  }

  @Get("permalink/:permalinkIdOrSlug/by-id/:mediaId/download")
  @AllowAnonymous()
  async download(
    @Param("permalinkIdOrSlug") permalinkIdOrSlug: string,
    @Param("mediaId") mediaId: string,
    @Res() res: express.Response,
  ): Promise<void> {
    try {
      await this.assertReferencedOr404(permalinkIdOrSlug, mediaId);
      const result = await this.mediaService.getFilestreamById(mediaId);
      streamMedia(res, result.media, result.stream);
    } catch {
      res.status(404).json({ error: "File not found" });
    }
  }

  /**
   * Resolve the permalink to its passport (public publish/ownership gate) and assert the
   * mediaId is one of that passport's File-element values. Anything else is a 404.
   */
  private async assertReferencedOr404(permalinkIdOrSlug: string, mediaId: string): Promise<void> {
    let passport: Passport;
    try {
      ({ passport } = await this.permalinkApplicationService.resolveToPassport(permalinkIdOrSlug));
    } catch {
      throw new NotFoundException("Media not found");
    }
    if (!(await this.passportReferencesMedia(passport, mediaId))) {
      throw new NotFoundException("Media not found");
    }
  }

  /** Whether `mediaId` is referenced by a File element anywhere in the passport's submodels. */
  private async passportReferencesMedia(passport: Passport, mediaId: string): Promise<boolean> {
    const submodelIds = passport.getEnvironment().submodels;
    if (submodelIds.length === 0) {
      return false;
    }
    const submodels = await this.submodelRepository.findByIds(submodelIds);
    const mediaIds = new Set<string>();
    for (const submodel of submodels.values()) {
      collectFileMediaIds(submodel.getSubmodelElements(), mediaIds);
    }
    return mediaIds.has(mediaId);
  }
}
