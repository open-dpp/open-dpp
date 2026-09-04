import { expect, describe, it, beforeEach } from "@jest/globals";
import * as XLSX from "xlsx";
import { ExcelParser } from "./excel-parser";

// Helper to create a minimal Excel workbook with given data
function createExcelBuffer(data: unknown[][]): Buffer {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

describe("ExcelParser", () => {
  let parser: ExcelParser;

  beforeEach(() => {
    parser = new ExcelParser();
  });

  describe("parse", () => {
    it("parses a simple Excel file with header row", () => {
      const data = [
        ["name", "age", "city"],
        ["John", 30, "NYC"],
        ["Jane", 25, "LA"],
      ];
      const buffer = createExcelBuffer(data);

      const result = parser.parse(buffer);

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].name).toBe("John");
      expect(result.rows[0].age).toBe("30");
      expect(result.rows[0].city).toBe("NYC");
      expect(result.rows[1].name).toBe("Jane");
      expect(result.rows[1].age).toBe("25");
      expect(result.rows[1].city).toBe("LA");
    });

    it("handles empty cells as null", () => {
      const data = [
        ["name", "age", "city"],
        ["John", 30, null],
        ["Jane", null, "LA"],
      ];
      const buffer = createExcelBuffer(data);

      const result = parser.parse(buffer);

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].city).toBeNull();
      expect(result.rows[1].age).toBeNull();
    });

    it("converts Excel dates to strings", () => {
      // Excel date: 44197 = 2021-01-01
      const data = [
        ["name", "date"],
        ["Event", 44197],
      ];
      const buffer = createExcelBuffer(data);

      const result = parser.parse(buffer);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].date).toBe("44197");
    });

    it("converts boolean values to strings", () => {
      const data = [
        ["name", "active"],
        ["John", true],
        ["Jane", false],
      ];
      const buffer = createExcelBuffer(data);

      const result = parser.parse(buffer);

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].active).toBe("true");
      expect(result.rows[1].active).toBe("false");
    });

    it("converts numbers to strings", () => {
      const data = [
        ["name", "value"],
        ["Item", 123.45],
      ];
      const buffer = createExcelBuffer(data);

      const result = parser.parse(buffer);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].value).toBe("123.45");
    });

    it("uses only the first sheet", () => {
      const workbook = XLSX.utils.book_new();

      // First sheet
      const sheet1 = XLSX.utils.aoa_to_sheet([
        ["name", "sheet"],
        ["John", "Sheet1"],
      ]);
      XLSX.utils.book_append_sheet(workbook, sheet1, "Sheet1");

      // Second sheet (should be ignored)
      const sheet2 = XLSX.utils.aoa_to_sheet([
        ["name", "sheet"],
        ["Jane", "Sheet2"],
      ]);
      XLSX.utils.book_append_sheet(workbook, sheet2, "Sheet2");

      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      const result = parser.parse(buffer);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].name).toBe("John");
      expect(result.rows[0].sheet).toBe("Sheet1");
    });

    it("rejects files with no data rows (header only)", () => {
      const data = [["name", "age"]];
      const buffer = createExcelBuffer(data);

      expect(() => parser.parse(buffer)).toThrow(/File must contain at least 1 data row/);
    });

    it("rejects files with more than 1000 rows", () => {
      const data: unknown[][] = [["col1", "col2"]];
      for (let i = 0; i < 1001; i++) {
        data.push([`val${i}`, `val${i}`]);
      }
      const buffer = createExcelBuffer(data);

      expect(() => parser.parse(buffer)).toThrow(
        /File contains 1001 rows, maximum allowed is 1000/,
      );
    });

    it("handles files with inconsistent column counts", () => {
      const data = [
        ["name", "age", "city"],
        ["John", 30], // Missing 'city'
        ["Jane", 25, "LA", "Extra"], // Extra column
      ];
      const buffer = createExcelBuffer(data);

      const { rows } = parser.parse(buffer);

      // Check if rows were parsed
      expect(rows).toEqual([
        {
          name: "John",
          age: "30",
          city: null,
        },
        {
          name: "Jane",
          age: "25",
          city: "LA",
        },
      ]);
    });

    it("handles UTF-8 characters", () => {
      const data = [
        ["name", "city"],
        ["Jöhn", "Zürich"],
        ["Jañe", "München"],
      ];
      const buffer = createExcelBuffer(data);

      const result = parser.parse(buffer);

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].name).toBe("Jöhn");
      expect(result.rows[0].city).toBe("Zürich");
    });
  });
});
