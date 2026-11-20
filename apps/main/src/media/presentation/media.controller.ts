import type express from "express";
import type { Media } from "../domain/media";
import {
  Controller,
  Delete,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { Session } from "../../identity/auth/domain/session";
import { AllowAnonymous } from "../../identity/auth/presentation/decorators/allow-anonymous.decorator";
import { AuthSession } from "../../identity/auth/presentation/decorators/auth-session.decorator";
import { OrganizationId } from "../../identity/auth/presentation/decorators/organization-id.decorator";
import { Policy } from "../../policy/presentation/policy.decorator";
import { BucketDefaultPaths, MediaService } from "../infrastructure/media.service";
import { sendMediaFile } from "./media-response";
import { VirusScanFileValidator } from "./virus-scan.file-validator";
import {
  MEDIA_UPLOAD_MAX_SIZE_BYTES,
  ORGANIZATION_PROFILE_UPLOAD_MIME_TYPES,
  PolicyKeyList,
} from "@open-dpp/dto";

/**
 * Size and virus checks. The type is detected from the content by `MediaService`, which
 * rejects unsupported files with a 400.
 */
function uploadedMediaPipe(): ParseFilePipe {
  return new ParseFilePipe({
    validators: [
      new MaxFileSizeValidator({ maxSize: MEDIA_UPLOAD_MAX_SIZE_BYTES }),
      new VirusScanFileValidator({ storageType: "memory" }),
    ],
  });
}

@Controller("media")
export class MediaController {
  private readonly filesService: MediaService;

  constructor(filesService: MediaService) {
    this.filesService = filesService;
  }

  @Post("dpp/:upi/:dataFieldId")
  @Policy(PolicyKeyList.MEDIA_STORAGE_LIMIT)
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
    }),
  )
  async uploadDppFile(
    @UploadedFile(uploadedMediaPipe())
    file: Express.Multer.File,
    @OrganizationId() orgId: string,
    @Param("upi") upi: string,
    @Param("dataFieldId") dataFieldId: string,
    @AuthSession() session: Session,
  ): Promise<{
    mediaId: string;
  }> {
    const media = await this.filesService.uploadFileOfProductPassport(
      file.originalname,
      file.buffer,
      dataFieldId,
      upi,
      session.userId,
      orgId,
    );
    return {
      mediaId: media.id,
    };
  }

  @Get("dpp/:upi/:dataFieldId/info")
  @AllowAnonymous()
  async getDppFileInfo(
    @Param("upi") upi: string,
    @Param("dataFieldId") dataFieldId: string,
  ): Promise<Media> {
    return this.filesService.findOneDppFileOrFail(dataFieldId, upi);
  }

  @Get("dpp/:upi/:dataFieldId/download")
  @AllowAnonymous()
  async streamDppFile(
    @Param("upi") upi: string,
    @Param("dataFieldId") dataFieldId: string,
    @Res() res: express.Response,
  ): Promise<void> {
    try {
      sendMediaFile(res, await this.filesService.getFilestreamOfProductPassport(dataFieldId, upi));
    } catch {
      res.status(404).json({ error: "File not found" });
    }
  }

  @Get("by-organization")
  async getFileInfoByOrganization(@OrganizationId() organizationId: string): Promise<Array<Media>> {
    return this.filesService.findAllByOrganizationId(organizationId);
  }

  @Get(":id/download")
  @AllowAnonymous()
  async streamFile(@Param("id") id: string, @Res() res: express.Response): Promise<void> {
    try {
      sendMediaFile(res, await this.filesService.getFilestreamById(id));
    } catch {
      res.status(404).json({ error: "File not found" });
    }
  }

  @Get(":id/info")
  @AllowAnonymous()
  async getMediaInfo(@Param("id") id: string): Promise<Media> {
    return await this.filesService.findOneOrFail(id);
  }

  @Delete(":id")
  async deleteFile(@Param("id") id: string) {
    return await this.filesService.deleteFileById(id);
  }

  @Post("upload")
  @Policy(PolicyKeyList.MEDIA_STORAGE_LIMIT)
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
    }),
  )
  async uploadFile(
    @UploadedFile(uploadedMediaPipe())
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
  @Policy(PolicyKeyList.MEDIA_STORAGE_LIMIT)
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
    }),
  )
  async uploadOrganizationProfile(
    @UploadedFile(uploadedMediaPipe())
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
      {
        allowedMimeTypes: ORGANIZATION_PROFILE_UPLOAD_MIME_TYPES,
        remoteFolders: [BucketDefaultPaths.ORGANIZATION_PROFILE_PICTURES],
      },
    );
    return {
      mediaId: media.id,
    };
  }
}
