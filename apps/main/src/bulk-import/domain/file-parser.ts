import type { BulkImportRowDto } from "@open-dpp/dto";

/**
 * Abstract base class for file parsers using Template Method pattern.
 * Defines the skeleton of the parsing algorithm, with concrete subclasses
 * implementing the file-type-specific steps.
 */
export abstract class FileParser {
  /**
   * Maximum number of data rows allowed.
   */
  protected readonly MAX_ROWS = 1000;

  /**
   * Template method: defines the parsing algorithm.
   */
  parse(buffer: Buffer): { rows: BulkImportRowDto[] } {
    this.validateFileSize(buffer);
    const rows = this.parseFileContent(buffer);
    return { rows: this.postProcessRows(rows) };
  }

  /**
   * Validates file size limit.
   */
  protected validateFileSize(buffer: Buffer): void {
    const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new Error(
        `File size ${buffer.length} bytes exceeds maximum of ${MAX_FILE_SIZE_BYTES} bytes`,
      );
    }
  }

  /**
   * Parses the file content into raw rows.
   * To be implemented by subclasses.
   */
  protected abstract parseFileContent(buffer: Buffer): BulkImportRowDto[];

  /**
   * Post-processes rows: validates structure, transforms values.
   */
  protected postProcessRows(rows: BulkImportRowDto[]): BulkImportRowDto[] {
    this.validateRows(rows);
    return this.transformValues(rows);
  }

  /**
   * Validates parsed rows structure.
   */
  protected validateRows(rows: BulkImportRowDto[]): void {
    const errors: string[] = [];

    if (rows.length < 1) {
      errors.push("File must contain at least 1 data row (after headers)");
    }

    if (rows.length > this.MAX_ROWS) {
      errors.push(`File contains ${rows.length} rows, maximum allowed is ${this.MAX_ROWS}`);
    }

    // Check for duplicate headers
    const headerKeys = Object.keys(rows[0] || {});
    const duplicateHeaders = headerKeys.filter(
      (key, index) => headerKeys.indexOf(key) !== index,
    );
    if (duplicateHeaders.length > 0) {
      errors.push(`Duplicate column names: ${duplicateHeaders.join(", ")}`);
    }

    // Check each row has same keys as header
    for (let i = 0; i < rows.length; i++) {
      const rowKeys = Object.keys(rows[i]);
      if (rowKeys.length !== headerKeys.length) {
        errors.push(`Row ${i + 2} has ${rowKeys.length} columns, expected ${headerKeys.length}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join("; "));
    }
  }

  /**
   * Transforms values to ensure consistent types (string or null).
   */
  protected transformValues(rows: BulkImportRowDto[]): BulkImportRowDto[] {
    return rows.map((row) => {
      const transformed: BulkImportRowDto = {};
      for (const [key, value] of Object.entries(row)) {
        transformed[key] = value === undefined || value === null || value === "" ? null : String(value);
      }
      return transformed;
    });
  }
}
