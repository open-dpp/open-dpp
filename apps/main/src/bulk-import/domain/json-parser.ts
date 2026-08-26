import { FileParser } from "./file-parser";
import type { BulkImportRowDto } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";

/**
 * Parser for JSON files.
 * Expects a JSON array of objects where keys are column headers.
 */
export class JsonParser extends FileParser {
  protected parseFileContent(buffer: Buffer): BulkImportRowDto[] {
    const content = buffer.toString("utf8");
    const json: unknown = JSON.parse(content);

    if (!Array.isArray(json)) {
      throw new ValueError("JSON root must be an array");
    }

    const rows: BulkImportRowDto[] = [];
    for (const item of json) {
      if (typeof item !== "object" || item === null || Array.isArray(item)) {
        throw new ValueError("Each JSON array element must be a non-null object");
      }
      rows.push(item as BulkImportRowDto);
    }

    return rows;
  }
}
