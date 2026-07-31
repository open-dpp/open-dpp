import { Injectable } from "@nestjs/common";
import type { BulkImportParseResultDto } from "@open-dpp/dto";
import { CsvParser } from "../domain/csv-parser";
import { ExcelParser } from "../domain/excel-parser";
import { JsonParser } from "../domain/json-parser";

const SUPPORTED_EXTENSIONS = new Set([".json", ".csv", ".xlsx"]);
const SUPPORTED_MIME_TYPES = new Set([
  "application/json",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

@Injectable()
export class BulkImportFileParserService {
  private readonly csvParser: CsvParser;
  private readonly excelParser: ExcelParser;
  private readonly jsonParser: JsonParser;

  constructor() {
    this.csvParser = new CsvParser();
    this.excelParser = new ExcelParser();
    this.jsonParser = new JsonParser();
  }

  /**
   * Parses a file (JSON, CSV, or Excel) and returns the rows.
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
  ): "json" | "csv" | "xlsx" {
    // Check content type first
    if (contentType && SUPPORTED_MIME_TYPES.has(contentType)) {
      if (contentType.includes("json")) return "json";
      if (contentType.includes("spreadsheetml")) return "xlsx";
      if (contentType.includes("csv")) return "csv";
    }

    // Check file extension
    const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
    if (SUPPORTED_EXTENSIONS.has(ext)) {
      if (ext === ".json") return "json";
      if (ext === ".xlsx") return "xlsx";
      if (ext === ".csv") return "csv";
    }

    // Check magic numbers for binary detection
    // Excel files (xlsx) are ZIP files, start with PK magic number
    if (buffer.length >= 2) {
      const magic = buffer.subarray(0, 2).toString();
      if (magic === "PK") return "xlsx";
    }

    // Check for JSON by trying to detect if it starts with [ or {
    if (buffer.length >= 1) {
      const firstChar = buffer.subarray(0, 1).toString();
      if (firstChar === "[" || firstChar === "{") return "json";
    }

    // Default to CSV
    return "csv";
  }

  /**
   * Returns the appropriate parser for the file type.
   */
  private getParser(fileType: "json" | "csv" | "xlsx") {
    if (fileType === "xlsx") {
      return this.excelParser;
    }
    if (fileType === "json") {
      return this.jsonParser;
    }
    return this.csvParser;
  }
}
