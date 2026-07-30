import { Injectable } from "@nestjs/common";
import type { BulkImportParseResultDto } from "@open-dpp/dto";
import { CsvParser } from "../domain/csv-parser";
import { ExcelParser } from "../domain/excel-parser";

const SUPPORTED_EXTENSIONS = new Set([".csv", ".xlsx"]);
const SUPPORTED_MIME_TYPES = new Set([
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

@Injectable()
export class BulkImportFileParserService {
  private readonly csvParser: CsvParser;
  private readonly excelParser: ExcelParser;

  constructor() {
    this.csvParser = new CsvParser();
    this.excelParser = new ExcelParser();
  }

  /**
   * Parses a file (CSV or Excel) and returns the rows.
   */
  parseFile(
    buffer: Buffer,
    filename: string,
    contentType: string | undefined,
  ): BulkImportParseResultDto {
    const fileType = this.detectFileType(buffer, filename, contentType);

    const parser = this.getParser(fileType);
    const { rows } = parser.parse(buffer);

    return { rows };
  }

  /**
   * Detects the file type based on content, extension, and MIME type.
   */
  private detectFileType(
    buffer: Buffer,
    filename: string,
    contentType: string | undefined,
  ): "csv" | "xlsx" {
    // Check content type first
    if (contentType && SUPPORTED_MIME_TYPES.has(contentType)) {
      if (contentType.includes("spreadsheetml")) return "xlsx";
      if (contentType.includes("csv")) return "csv";
    }

    // Check file extension
    const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
    if (SUPPORTED_EXTENSIONS.has(ext)) {
      if (ext === ".xlsx") return "xlsx";
      if (ext === ".csv") return "csv";
    }

    // Check magic numbers for binary detection
    // Excel files (xlsx) are ZIP files, start with PK magic number
    if (buffer.length >= 2) {
      const magic = buffer.subarray(0, 2).toString();
      if (magic === "PK") return "xlsx";
    }

    // Default to CSV
    return "csv";
  }

  /**
   * Returns the appropriate parser for the file type.
   */
  private getParser(fileType: "csv" | "xlsx") {
    if (fileType === "xlsx") {
      return this.excelParser;
    }
    return this.csvParser;
  }
}
