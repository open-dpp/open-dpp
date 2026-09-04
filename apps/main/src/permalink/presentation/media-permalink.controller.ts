import type express from "express";
import type { PublicMediaInfo } from "../../media/presentation/media-response.util";
import type { Passport } from "../../passports/domain/passport";
import { Controller, Get, NotFoundException, Param, Res } from "@nestjs/common";
import { File } from "../../aas/domain/submodel-base/file";
import { ISubmodelElement } from "../../aas/domain/submodel-base/submodel-base";
import { AasRepository } from "../../aas/infrastructure/aas.repository";
import { SubmodelRepository } from "../../aas/infrastructure/submodel.repository";
import { Session } from "../../identity/auth/domain/session";
import { AuthSession } from "../../identity/auth/presentation/decorators/auth-session.decorator";
import { OptionalAuth } from "../../identity/auth/presentation/decorators/optional-auth.decorator";
import { MediaService } from "../../media/infrastructure/media.service";
import { streamMedia, toPublicMediaInfo } from "../../media/presentation/media-response.util";
import {
  PermalinkAccessContext,
  PermalinkApplicationService,
} from "../application/services/permalink.application.service";

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
 * Permalink-gated media: a passport's media is publicly readable ONLY through one of that
 * passport's permalinks, exactly like the rest of its data.
 *
 * Resolving the permalink applies the publish/ownership gate (`resolveToPassport`), and the
 * requested media must be referenced by that passport — a File-element value or a shell's
 * default thumbnail (the mediaId IS the passport↔media link — no denormalized field). So a
 * deleted permalink or an unpublished passport 404s, and one passport's permalink cannot pull
 * a media that the passport does not reference (no cross-passport IDOR). Many-to-many: a media
 * shown on several passports is reachable through each of their permalinks.
 *
 * Like the other permalink routes, the caller's session (if any) is forwarded to the gate,
 * so a member of the passport's organization can preview the media of a still-unpublished
 * draft while anonymous callers only ever see published passports.
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
    private readonly aasRepository: AasRepository,
  ) {}

  @Get("permalink/:permalinkIdOrSlug/by-id/:mediaId/info")
  @OptionalAuth()
  async getInfo(
    @Param("permalinkIdOrSlug") permalinkIdOrSlug: string,
    @Param("mediaId") mediaId: string,
    @AuthSession() session: Session | undefined,
  ): Promise<PublicMediaInfo> {
    await this.assertReferencedOr404(permalinkIdOrSlug, mediaId, { userId: session?.userId });
    return toPublicMediaInfo(await this.mediaService.findOneOrFail(mediaId));
  }

  @Get("permalink/:permalinkIdOrSlug/by-id/:mediaId/download")
  @OptionalAuth()
  async download(
    @Param("permalinkIdOrSlug") permalinkIdOrSlug: string,
    @Param("mediaId") mediaId: string,
    @AuthSession() session: Session | undefined,
    @Res() res: express.Response,
  ): Promise<void> {
    try {
      await this.assertReferencedOr404(permalinkIdOrSlug, mediaId, { userId: session?.userId });
      const result = await this.mediaService.getFilestreamById(mediaId);
      streamMedia(res, result.media, result.stream);
    } catch {
      res.status(404).json({ error: "File not found" });
    }
  }

  /**
   * Resolve the permalink to its passport (public publish/ownership gate, member-aware via
   * `access`) and assert the passport references the mediaId. Anything else is a 404.
   */
  private async assertReferencedOr404(
    permalinkIdOrSlug: string,
    mediaId: string,
    access: PermalinkAccessContext,
  ): Promise<void> {
    let passport: Passport;
    try {
      ({ passport } = await this.permalinkApplicationService.resolveToPassport(
        permalinkIdOrSlug,
        access,
      ));
    } catch {
      throw new NotFoundException("Media not found");
    }
    if (!(await this.passportReferencesMedia(passport, mediaId))) {
      throw new NotFoundException("Media not found");
    }
  }

  /**
   * Whether `mediaId` is a default thumbnail of one of the passport's shells or the value of a
   * File element anywhere in its submodels. Shells are checked first: there are few of them,
   * so a thumbnail hit skips the heavier submodel walk.
   */
  private async passportReferencesMedia(passport: Passport, mediaId: string): Promise<boolean> {
    const environment = passport.getEnvironment();
    if (await this.shellsReferenceMedia(environment.assetAdministrationShells, mediaId)) {
      return true;
    }
    return await this.submodelsReferenceMedia(environment.submodels, mediaId);
  }

  private async shellsReferenceMedia(shellIds: string[], mediaId: string): Promise<boolean> {
    if (shellIds.length === 0) {
      return false;
    }
    const shells = await this.aasRepository.findByIds(shellIds);
    for (const shell of shells.values()) {
      if (shell.assetInformation.defaultThumbnails.some((thumb) => thumb.path === mediaId)) {
        return true;
      }
    }
    return false;
  }

  private async submodelsReferenceMedia(submodelIds: string[], mediaId: string): Promise<boolean> {
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
