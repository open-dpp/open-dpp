import {
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import type { BulkImportParseResultDto } from "@open-dpp/dto";
import { BulkImportParseResultDtoSchema } from "@open-dpp/dto";
import { OrganizationId } from "../../identity/auth/presentation/decorators/organization-id.decorator";
import { BulkImportFileParserService } from "../infrastructure/bulk-import-file-parser.service";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Custom validator for supported file types (CSV, Excel).
 */
class BulkImportFileTypeValidator extends FileTypeValidator {
  constructor() {
    super({
      fileType:
        /^(text\/csv|application\/vnd\.ms-excel|application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet)$/i,
      skipMagicNumbersValidation: true,
    });
  }
}

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
        validators: [
          new MaxFileSizeValidator({
            maxSize: MAX_FILE_SIZE_BYTES,
          }),
          new BulkImportFileTypeValidator(),
        ],
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
