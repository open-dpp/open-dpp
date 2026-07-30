import * as XLSX from "xlsx";
import type { BulkImportRowDto } from "@open-dpp/dto";
import { FileParser } from "./file-parser";

/**
 * Concrete parser for CSV files.
 * Uses XLSX library which can parse CSV as well as Excel.
 */
export class CsvParser extends FileParser {
  protected parseFileContent(buffer: Buffer): BulkImportRowDto[] {
    const text = buffer.toString("utf8");

    // Use XLSX to parse CSV - it handles delimiters, quotes, etc.
    const workbook = XLSX.read(text, { type: "string", raw: false });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      return [];
    }

    const worksheet = workbook.Sheets[sheetName];

    // sheet_to_json with header: 1 returns arrays (first row is headers)
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, blankrows: false });

    if (data.length === 0) {
      return [];
    }

    // First row contains headers
    const headers = data[0] as string[];
    this.validateHeaders(headers);

    const rows: BulkImportRowDto[] = [];

    // Process data rows (skip header row at index 0)
    for (let i = 1; i < data.length; i++) {
      const rowArray = data[i] as unknown[];
      const row: BulkImportRowDto = {};

      for (let j = 0; j < headers.length; j++) {
        if (headers[j] == null) {
          continue;
        }
        const header = headers[j];
        const value = rowArray[j];
        row[header] = value === undefined || value === null || value === "" ? null : String(value);
      }

      rows.push(row);
    }

    return rows;
  }
}
