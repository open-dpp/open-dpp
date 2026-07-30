import { Test, TestingModule } from "@nestjs/testing";
import { expect, describe, it, beforeEach } from "@jest/globals";
import * as XLSX from "xlsx";
import { BulkImportFileParserService } from "./bulk-import-file-parser.service";

// Helper to create a minimal Excel workbook
function createExcelBuffer(data: unknown[][]): Buffer {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

describe("BulkImportFileParserService", () => {
  let service: BulkImportFileParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BulkImportFileParserService],
    }).compile();

    service = module.get<BulkImportFileParserService>(BulkImportFileParserService);
  });

  describe("parseFile", () => {
    describe("CSV files", () => {
      it("parses CSV file by MIME type", () => {
        const csvContent = `name,age\nJohn,30`;
        const buffer = Buffer.from(csvContent, "utf8");

        const result = service.parseFile(buffer, "test.csv", "text/csv");

        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].name).toBe("John");
        expect(result.rows[0].age).toBe("30");
      });

      it("parses CSV file by extension", () => {
        const csvContent = `name,age\nJohn,30`;
        const buffer = Buffer.from(csvContent, "utf8");

        const result = service.parseFile(buffer, "test.csv", "application/octet-stream");

        expect(result.rows).toHaveLength(1);
      });

      it("parses CSV with semicolon delimiter", () => {
        const csvContent = `name;age\nJohn;30`;
        const buffer = Buffer.from(csvContent, "utf8");

        const result = service.parseFile(buffer, "test.csv", "text/csv");

        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].name).toBe("John");
      });
    });

    describe("Excel files", () => {
      it("parses Excel file by MIME type", () => {
        const data = [
          ["name", "age"],
          ["John", 30],
        ];
        const buffer = createExcelBuffer(data);

        const result = service.parseFile(
          buffer,
          "test.xlsx",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );

        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].name).toBe("John");
        expect(result.rows[0].age).toBe("30");
      });

      it("parses Excel file by extension", () => {
        const data = [
          ["name", "age"],
          ["John", 30],
        ];
        const buffer = createExcelBuffer(data);

        const result = service.parseFile(buffer, "test.xlsx", "application/octet-stream");

        expect(result.rows).toHaveLength(1);
      });

      it("parses Excel file by magic number", () => {
        const data = [
          ["name", "age"],
          ["John", 30],
        ];
        const buffer = createExcelBuffer(data);

        // xlsx files start with PK (ZIP magic number)
        const result = service.parseFile(buffer, "test.bin", "application/octet-stream");

        expect(result.rows).toHaveLength(1);
      });

      it("uses first sheet only", () => {
        const workbook = XLSX.utils.book_new();

        const sheet1 = XLSX.utils.aoa_to_sheet([["name"], ["Sheet1"]]);
        XLSX.utils.book_append_sheet(workbook, sheet1, "First");

        const sheet2 = XLSX.utils.aoa_to_sheet([["name"], ["Sheet2"]]);
        XLSX.utils.book_append_sheet(workbook, sheet2, "Second");

        const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

        const result = service.parseFile(buffer, "test.xlsx", "application/octet-stream");

        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].name).toBe("Sheet1");
      });
    });

    describe("File type detection", () => {
      it("defaults to CSV for unknown files", () => {
        const csvContent = `name,age\nJohn,30`;
        const buffer = Buffer.from(csvContent, "utf8");

        const result = service.parseFile(buffer, "test.dat", "text/plain");

        expect(result.rows).toHaveLength(1);
      });
    });

    describe("Validation", () => {
      it("rejects files larger than 10MB", () => {
        const largeContent = "x".repeat(10 * 1024 * 1024 + 1);
        const buffer = Buffer.from(largeContent, "utf8");

        expect(() => service.parseFile(buffer, "large.csv", "text/csv")).toThrow(
          /File size.*exceeds maximum/,
        );
      });

      it("rejects files with no data rows", () => {
        const csvContent = `name,age`;
        const buffer = Buffer.from(csvContent, "utf8");

        expect(() => service.parseFile(buffer, "test.csv", "text/csv")).toThrow(
          /File must contain at least 1 data row/,
        );
      });

      it("rejects files with more than 1000 rows", () => {
        const header = "col1,col2";
        const rows = Array.from({ length: 1001 }, (_, i) => `val${i},val${i}`).join("\n");
        const csvContent = `${header}\n${rows}`;
        const buffer = Buffer.from(csvContent, "utf8");

        expect(() => service.parseFile(buffer, "test.csv", "text/csv")).toThrow(
          /File contains 1001 rows/,
        );
      });

      it("rejects files with duplicate column names", () => {
        const csvContent = `name,name\nJohn,Doe`;
        const buffer = Buffer.from(csvContent, "utf8");

        expect(() => service.parseFile(buffer, "test.csv", "text/csv")).toThrow(
          /Duplicate column names/,
        );
      });
    });

    describe("Value transformation", () => {
      it("converts empty cells to null", () => {
        const csvContent = `name,age\nJohn,`;
        const buffer = Buffer.from(csvContent, "utf8");

        const result = service.parseFile(buffer, "test.csv", "text/csv");

        expect(result.rows[0].age).toBeNull();
      });

      it("keeps non-empty values as strings", () => {
        const csvContent = `name,age\nJohn,30`;
        const buffer = Buffer.from(csvContent, "utf8");

        const result = service.parseFile(buffer, "test.csv", "text/csv");

        expect(typeof result.rows[0].name).toBe("string");
        expect(typeof result.rows[0].age).toBe("string");
      });
    });
  });
});
