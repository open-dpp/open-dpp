import type express from "express";
import type { Media } from "../../media/domain/media";
import type { PublicMediaInfo } from "../../media/presentation/media-response.util";
import type { Passport } from "../../passports/domain/passport";
import { Controller, Get, Header, NotFoundException, Param, Res } from "@nestjs/common";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { File } from "../../aas/domain/submodel-base/file";
import { ISubmodelElement } from "../../aas/domain/submodel-base/submodel-base";
import { AasRepository } from "../../aas/infrastructure/aas.repository";
import { SubmodelRepository } from "../../aas/infrastructure/submodel.repository";
import { Session } from "../../identity/auth/domain/session";
import { AuthSession } from "../../identity/auth/presentation/decorators/auth-session.decorator";
import { OptionalAuth } from "../../identity/auth/presentation/decorators/optional-auth.decorator";
import { MediaService } from "../../media/infrastructure/media.service";
import {
  MEDIA_CACHE_CONTROL,
  streamMedia,
  toPublicMediaInfo,
} from "../../media/presentation/media-response.util";
import {
  PermalinkAccessContext,
  PermalinkApplicationService,
} from "../application/services/permalink.application.service";

/**
 * The only failures the permalink-gated routes collapse into a 404: a missing permalink,
 * passport or media record (`NotFoundInDatabaseException`) and the publish/ownership denial
 * the gate normalizes to `NotFoundException`, so the response cannot be used to enumerate
 * which permalinks or mediaIds exist. Database, object-store and other operational errors are
 * unexpected and must surface as a 5xx via Nest's exception layer instead of being masked.
 */
function isExpectedMediaLookupError(error: unknown): boolean {
  return error instanceof NotFoundInDatabaseException || error instanceof NotFoundException;
}

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
 * default thumbnail (the mediaId IS the passport↔media link — no denormalized field) — and be
 * owned by the passport's organization (`Media.ownedByOrganizationId`). So a deleted permalink
 * or an unpublished passport 404s, one passport's permalink cannot pull a media that the
 * passport does not reference (no cross-passport IDOR), and a passport that points at another
 * organization's media cannot expose it (no cross-organization reference: a member could
 * otherwise write a foreign mediaId into a File value or thumbnail and publish it through their
 * own permalink). Many-to-many: a media shown on several passports of its owning organization
 * is reachable through each of their permalinks.
 *
 * Like the other permalink routes, the caller's session (if any) is forwarded to the gate,
 * so a member of the passport's organization can preview the media of a still-unpublished
 * draft while anonymous callers only ever see published passports.
 *
 * Every response, the `/info` JSON and the 404 branch included, is `Cache-Control: no-store`:
 * the gate is re-evaluated per request and per session, so a stored copy would keep serving
 * after an unpublish or hand a member's draft preview to anonymous callers via a shared cache.
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
  @Header("Cache-Control", MEDIA_CACHE_CONTROL)
  async getInfo(
    @Param("permalinkIdOrSlug") permalinkIdOrSlug: string,
    @Param("mediaId") mediaId: string,
    @AuthSession() session: Session | undefined,
  ): Promise<PublicMediaInfo> {
    const media = await this.loadReferencedMediaOr404(permalinkIdOrSlug, mediaId, {
      userId: session?.userId,
    });
    return toPublicMediaInfo(media);
  }

  @Get("permalink/:permalinkIdOrSlug/by-id/:mediaId/download")
  @OptionalAuth()
  @Header("Cache-Control", MEDIA_CACHE_CONTROL)
  async download(
    @Param("permalinkIdOrSlug") permalinkIdOrSlug: string,
    @Param("mediaId") mediaId: string,
    @AuthSession() session: Session | undefined,
    @Res() res: express.Response,
  ): Promise<void> {
    try {
      const media = await this.loadReferencedMediaOr404(permalinkIdOrSlug, mediaId, {
        userId: session?.userId,
      });
      const stream = await this.mediaService.getFilestreamOfMedia(media);
      streamMedia(res, media, stream);
    } catch (error) {
      if (!isExpectedMediaLookupError(error)) {
        throw error;
      }
      res.status(404).json({ error: "File not found" });
    }
  }

  /**
   * Resolve the permalink to its passport (public publish/ownership gate, member-aware via
   * `access`), assert the passport references the mediaId, then load the media, which must be
   * owned by the passport's organization. An expected miss (see `isExpectedMediaLookupError`),
   * an unreferenced media and a foreign-owned media are all the same 404 so the response cannot
   * tell them apart; operational failures propagate.
   */
  private async loadReferencedMediaOr404(
    permalinkIdOrSlug: string,
    mediaId: string,
    access: PermalinkAccessContext,
  ): Promise<Media> {
    const passport = await this.resolvePassportOr404(permalinkIdOrSlug, access);
    if (!(await this.passportReferencesMedia(passport, mediaId))) {
      throw new NotFoundException("Media not found");
    }
    const media = await this.loadMediaOr404(mediaId);
    if (media.ownedByOrganizationId !== passport.organizationId) {
      throw new NotFoundException("Media not found");
    }
    return media;
  }

  private async resolvePassportOr404(
    permalinkIdOrSlug: string,
    access: PermalinkAccessContext,
  ): Promise<Passport> {
    try {
      const { passport } = await this.permalinkApplicationService.resolveToPassport(
        permalinkIdOrSlug,
        access,
      );
      return passport;
    } catch (error) {
      if (!isExpectedMediaLookupError(error)) {
        throw error;
      }
      throw new NotFoundException("Media not found");
    }
  }

  /** A dangling reference (a File value or thumbnail pointing at a deleted media) is a 404 too. */
  private async loadMediaOr404(mediaId: string): Promise<Media> {
    try {
      return await this.mediaService.findOneOrFail(mediaId);
    } catch (error) {
      if (!(error instanceof NotFoundInDatabaseException)) {
        throw error;
      }
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
