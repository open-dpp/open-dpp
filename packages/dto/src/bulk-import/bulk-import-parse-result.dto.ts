import { z } from "zod";

/**
 * Schema for a single row in the parsed file.
 * Keys are column headers from the first row, values are strings or null.
 */
export const BulkImportRowDtoSchema = z.record(z.string(), z.string().nullable());
export type BulkImportRowDto = z.infer<typeof BulkImportRowDtoSchema>;

/**
 * Result of parsing a bulk import file (CSV, Excel).
 */
export const BulkImportParseResultDtoSchema = z.object({
  rows: BulkImportRowDtoSchema.array().min(1).max(1000),
});

export type BulkImportParseResultDto = z.infer<typeof BulkImportParseResultDtoSchema>;
