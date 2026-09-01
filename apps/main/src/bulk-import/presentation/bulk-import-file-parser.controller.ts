import { Controller, ParseFilePipe, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import type { BulkImportParseResultDto } from "@open-dpp/dto";
import { BulkImportParseResultDtoSchema } from "@open-dpp/dto";
import { OrganizationId } from "../../identity/auth/presentation/decorators/organization-id.decorator";
import { BulkImportFileParserService } from "../infrastructure/bulk-import-file-parser.service";
import { BulkImportFileSizeValidator, BulkImportFileTypeValidator } from "./file-validation";

@Controller("bulk-import")
export class BulkImportFileParserController {
  constructor(private readonly bulkImportFileParserService: BulkImportFileParserService) {}

  @Post("parse-file")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
    }),
  )
  async parseFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new BulkImportFileSizeValidator(), new BulkImportFileTypeValidator()],
      }),
    )
    file: Express.Multer.File,
    @OrganizationId() _organizationId: string,
  ): Promise<BulkImportParseResultDto> {
    const result = this.bulkImportFileParserService.parseFile(
      file.buffer,
      file.originalname,
      file.mimetype,
    );
    return BulkImportParseResultDtoSchema.parse(result);
  }
}
