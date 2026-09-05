import type express from "express";
import type { Media } from "../domain/media";
import {
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  Header,
  MaxFileSizeValidator,
  NotFoundException,
  Param,
  ParseFilePipe,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { memoryStorage } from "multer";
import { Session } from "../../identity/auth/domain/session";
import { AuthSession } from "../../identity/auth/presentation/decorators/auth-session.decorator";
import { OrganizationId } from "../../identity/auth/presentation/decorators/organization-id.decorator";
import { MembersService } from "../../identity/organizations/application/services/members.service";
import { PolicyKey } from "../../policy/domain/policy";
import { Policy } from "../../policy/presentation/policy.decorator";
import { BucketDefaultPaths, MediaService } from "../infrastructure/media.service";
import {
  MEDIA_CACHE_CONTROL,
  PublicMediaInfo,
  streamMedia,
  toPublicMediaInfo,
} from "./media-response.util";
import { VirusScanFileValidator } from "./virus-scan.file-validator";

/**
 * The only failures the download route collapses into a 404: the missing-record case from the
 * media lookup and the membership denial `loadMediaForMember` normalizes to the same
 * NotFoundException, so the response cannot be used to enumerate which mediaIds exist.
 * Database, object-store and other operational errors are unexpected and must surface as a 5xx
 * via Nest's exception layer instead of being masked.
 */
function isMediaNotFoundError(error: unknown): boolean {
  return error instanceof NotFoundInDatabaseException || error instanceof NotFoundException;
}

@Controller("media")
export class MediaController {
  constructor(
    private readonly filesService: MediaService,
    private readonly membersService: MembersService,
  ) {}

  @Get("by-organization")
  async getFileInfoByOrganization(@OrganizationId() organizationId: string): Promise<Array<Media>> {
    return this.filesService.findAllByOrganizationId(organizationId);
  }

  @Get(":id/download")
  @Header("Cache-Control", MEDIA_CACHE_CONTROL)
  async streamFile(
    @Param("id") id: string,
    @AuthSession() session: Session,
    @Res() res: express.Response,
  ): Promise<void> {
    try {
      const media = await this.loadMediaForMember(id, session.userId);
      const stream = await this.filesService.getFilestreamOfMedia(media);
      streamMedia(res, media, stream);
    } catch (error) {
      if (!isMediaNotFoundError(error)) {
        throw error;
      }
      res.status(404).json({ error: "File not found" });
    }
  }

  @Get(":id/info")
  @Header("Cache-Control", MEDIA_CACHE_CONTROL)
  async getMediaInfo(
    @Param("id") id: string,
    @AuthSession() session: Session,
  ): Promise<PublicMediaInfo> {
    return toPublicMediaInfo(await this.loadMediaForMember(id, session.userId));
  }

  @Delete(":id")
  async deleteFile(@Param("id") id: string, @AuthSession() session: Session) {
    const media = await this.loadMediaForMember(id, session.userId);
    return await this.filesService.deleteFileById(media.id);
  }

  /**
   * Load a media by id, but only if the caller is a member of the media's OWNING organization
   * (derived from `media.ownedByOrganizationId`, not the request's active-org header — avoids the
   * cross-tenant IDOR where any authenticated user reads another org's media by id). 404 otherwise.
   */
  private async loadMediaForMember(id: string, userId: string): Promise<Media> {
    let media: Media;
    try {
      media = await this.filesService.findOneOrFail(id);
    } catch (error) {
      if (!(error instanceof NotFoundInDatabaseException)) {
        throw error;
      }
      // Collapse "does not exist" into the same 404 as "not a member" so the response shape
      // cannot be used to enumerate which mediaIds exist.
      throw new NotFoundException("Media not found");
    }
    if (!(await this.membersService.isMemberOfOrganization(userId, media.ownedByOrganizationId))) {
      throw new NotFoundException("Media not found");
    }
    return media;
  }

  @Post("upload")
  @Policy(PolicyKey.MEDIA_STORAGE_CAP)
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
    }),
  )
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 15 * 1024 * 1024 /* max 15MB */,
          }),
          new FileTypeValidator({
            fileType: /(image\/(jpeg|jpg|png|heic|webp)|application\/pdf)$/,
          }),
          new VirusScanFileValidator({ storageType: "memory" }),
        ],
      }),
    )
    file: Express.Multer.File,
    @OrganizationId() orgId: string,
    @AuthSession() session: Session,
  ): Promise<{
    mediaId: string;
  }> {
    const media = await this.filesService.uploadMedia(
      file.originalname,
      file.buffer,
      session.userId,
      orgId,
    );
    return {
      mediaId: media.id,
    };
  }

  @Post("organization-profile")
  @Policy(PolicyKey.MEDIA_STORAGE_CAP)
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
    }),
  )
  async uploadOrganizationProfile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 15 * 1024 * 1024 /* max 15MB */,
          }),
          new FileTypeValidator({
            fileType: /(image\/(jpeg|jpg|png|heic|webp))$/,
          }),
          new VirusScanFileValidator({ storageType: "memory" }),
        ],
      }),
    )
    file: Express.Multer.File,
    @OrganizationId() orgId: string,
    @AuthSession() session: Session,
  ): Promise<{
    mediaId: string;
  }> {
    const media = await this.filesService.uploadMedia(
      file.originalname,
      file.buffer,
      session.userId,
      orgId,
      [BucketDefaultPaths.ORGANIZATION_PROFILE_PICTURES],
    );
    return {
      mediaId: media.id,
    };
  }
}
