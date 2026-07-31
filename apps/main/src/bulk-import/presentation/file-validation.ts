import { FileTypeValidator, MaxFileSizeValidator } from "@nestjs/common";

/**
 * Custom validator for supported file types (JSON, CSV, Excel).
 */
export class BulkImportFileTypeValidator extends FileTypeValidator {
  constructor() {
    super({
      fileType:
        /^(application\/json|text\/csv|application\/vnd\.ms-excel|application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet)$/i,
      skipMagicNumbersValidation: true,
    });
  }
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export class BulkImportFileSizeValidator extends MaxFileSizeValidator {
  constructor() {
    super({
      maxSize: MAX_FILE_SIZE_BYTES,
    });
  }
}
