import type { BulkImportRowDto } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";

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
  protected errors: string[] = [];

  /**
   * Template method: defines the parsing algorithm.
   */
  parse(buffer: Buffer): { rows: BulkImportRowDto[] } {
    this.errors = [];
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

  protected validateHeaders(headers: string[]): void {
    const headerKeysSet = new Set(headers);
    if (headerKeysSet.size !== headers.length) {
      this.errors.push(`Duplicate column names: ${headers}`);
    }
  }

  /**
   * Validates parsed rows structure.
   */
  protected validateRows(rows: BulkImportRowDto[]): void {
    if (rows.length < 1) {
      this.errors.push("File must contain at least 1 data row (after headers)");
    }

    if (rows.length > this.MAX_ROWS) {
      this.errors.push(`File contains ${rows.length} rows, maximum allowed is ${this.MAX_ROWS}`);
    }

    const headerKeys = Object.keys(rows[0] || {});

    // Check each row has same keys as header
    for (let i = 0; i < rows.length; i++) {
      const rowKeys = Object.keys(rows[i]);
      if (rowKeys.length !== headerKeys.length) {
        this.errors.push(
          `Row ${i + 2} has ${rowKeys.length} columns, expected ${headerKeys.length}`,
        );
      }
    }

    if (this.errors.length > 0) {
      throw new ValueError(this.errors.join("; "));
    }
  }

  /**
   * Transforms values to ensure consistent types (string or null).
   */
  protected transformValues(rows: BulkImportRowDto[]): BulkImportRowDto[] {
    return rows.map((row) => {
      const transformed: BulkImportRowDto = {};
      for (const [key, value] of Object.entries(row)) {
        transformed[key.trim()] =
          value === undefined || value === null || value === "" ? null : String(value).trim();
      }
      return transformed;
    });
  }
}
