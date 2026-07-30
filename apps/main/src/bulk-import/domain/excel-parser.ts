import * as XLSX from "xlsx";
import type { BulkImportRowDto } from "@open-dpp/dto";
import { FileParser } from "./file-parser";

/**
 * Concrete parser for Excel (xlsx) files.
 * Uses XLSX library to parse the first sheet.
 */
export class ExcelParser extends FileParser {
  protected parseFileContent(buffer: Buffer): BulkImportRowDto[] {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    
    // Get first sheet only
    const sheetName = workbook.SheetNames[0];
    
    if (!sheetName) {
      return [];
    }

    const worksheet = workbook.Sheets[sheetName];
    
    // sheet_to_json with header: 1 returns arrays (first row is headers)
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
    
    if (data.length === 0) {
      return [];
    }

    // First row contains headers
    const headers = data[0] as string[];
    const rows: BulkImportRowDto[] = [];

    // Process data rows (skip header row at index 0)
    for (let i = 1; i < data.length; i++) {
      const rowArray = data[i] as unknown[];
      const row: BulkImportRowDto = {};
      
      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        const value = rowArray[j];
        // Handle Excel dates/numbers - convert to string
        row[header] = this.normalizeExcelValue(value);
      }
      
      rows.push(row);
    }

    return rows;
  }

  /**
   * Normalizes Excel cell values to strings.
   * Excel dates are stored as numbers, formulas as their results or text.
   */
  private normalizeExcelValue(value: unknown): string | null {
    if (value === undefined || value === null || value === "") {
      return null;
    }
    
    // Excel dates are numbers - convert to string representation
    // Excel booleans are already true/false
    // Everything else becomes a string
    if (typeof value === "number") {
      // Check if it's an Excel date serial number
      // Excel dates: 1 = 1900-01-01, so values < 100000 are likely dates
      // But we keep as number string for now
      return String(value);
    }
    
    if (typeof value === "boolean") {
      return value ? "true" : "false";
    }
    
    return String(value);
  }
}
