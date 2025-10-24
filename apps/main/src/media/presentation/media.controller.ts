import type express from "express";
import type { Media } from "../domain/media";
import {
  Controller,
  FileTypeValidator,
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
import { Public } from "@open-dpp/auth";
import { memoryStorage } from "multer";
import { UserSession } from "../../auth/auth.guard";
import { Session } from "../../auth/session.decorator";
import { MediaService } from "../infrastructure/media.service";
import { VirusScanFileValidator } from "./virus-scan.file-validator";

@Controller("media")
export class MediaController {
  private readonly filesService: MediaService;

  constructor(filesService: MediaService) {
    this.filesService = filesService;
  }

  @Post("profileImage")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
    }),
  )
  async uploadProfileImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 10 * 1024 * 1024 /* max 10MB */,
          }),
          new FileTypeValidator({
            fileType: /(image\/(jpeg|jpg|png|heic|webp))$/,
          }),
          new VirusScanFileValidator({ storageType: "memory" }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Session() session: UserSession,
  ): Promise<void> {
    await this.filesService.uploadProfilePicture(
      file.buffer,
      session.user.id,
    );
  }

  @Post("dpp/:orgId/:upi/:dataFieldId")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
    }),
  )
  async uploadDppFile(
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
    @Param("orgId") orgId: string,
    @Param("upi") upi: string,
    @Param("dataFieldId") dataFieldId: string,
    @Session() session: UserSession,
  ): Promise<{
    mediaId: string;
  }> {
    const media = await this.filesService.uploadFileOfProductPassport(
      file.originalname,
      file.buffer,
      dataFieldId,
      upi,
      session.user.id,
      orgId,
    );
    return {
      mediaId: media.id,
    };
  }

  @Get("dpp/:upi/:dataFieldId/info")
  @Public()
  async getDppFileInfo(
    @Param("upi") upi: string,
    @Param("dataFieldId") dataFieldId: string,
  ): Promise<Media> {
    return this.filesService.findOneDppFileOrFail(dataFieldId, upi);
  }

  @Get("dpp/:upi/:dataFieldId/download")
  @Public()
  async streamDppFile(
    @Param("upi") upi: string,
    @Param("dataFieldId") dataFieldId: string,
    @Res() res: express.Response,
  ): Promise<void> {
    try {
      const result = await this.filesService.getFilestreamOfProductPassport(
        dataFieldId,
        upi,
      );
      res.setHeader("Content-Type", result.media.mimeType);
      res.setHeader("Cross-Origin-Resource-Policy", "same-site");
      if (result.media.updatedAt) {
        res.setHeader("Last-Modified", result.media.updatedAt.toUTCString());
      }
      res.setHeader("Cache-Control", "private, max-age=31536000");
      result.stream.pipe(res);
      result.stream.on("error", () => {
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to retrieve file" });
        }
      });
    }
    catch {
      res.status(404).json({ error: "File not found" });
    }
  }

  @Get("by-organization/:organizationId")
  async getFileInfoByOrganization(
    @Param("organizationId") organizationId: string,
  ): Promise<Array<Media>> {
    return this.filesService.findAllByOrganizationId(organizationId);
  }

  @Get(":id/download")
  @Public()
  async streamFile(
    @Param("id") id: string,
    @Res() res: express.Response,
  ): Promise<void> {
    try {
      const result = await this.filesService.getFilestreamById(id);
      res.setHeader("Content-Type", result.media.mimeType);
      res.setHeader("Cross-Origin-Resource-Policy", "same-site");
      if (result.media.updatedAt) {
        res.setHeader("Last-Modified", result.media.updatedAt.toUTCString());
      }
      res.setHeader("Cache-Control", "private, max-age=31536000");
      result.stream.pipe(res);
      result.stream.on("error", () => {
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to retrieve file" });
        }
      });
    }
    catch {
      res.status(404).json({ error: "File not found" });
    }
  }

  @Get(":id/info")
  @Public()
  async getMediaInfo(@Param("id") id: string): Promise<Media> {
    return await this.filesService.findOneOrFail(id);
  }

  @Post(":orgId")
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
    @Param("orgId") orgId: string,
    @Session() session: UserSession,
  ): Promise<{
    mediaId: string;
  }> {
    const media = await this.filesService.uploadMedia(
      file.originalname,
      file.buffer,
      session.user.id,
      orgId,
    );
    return {
      mediaId: media.id,
    };
  }
}
