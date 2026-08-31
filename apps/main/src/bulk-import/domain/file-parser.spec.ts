import { describe, expect, it } from "@jest/globals";
import type { BulkImportRowDto } from "@open-dpp/dto";
import { FileParser } from "./file-parser";

// Concrete test implementation of FileParser for testing the base class
class TestParser extends FileParser {
  private rows: BulkImportRowDto[];

  constructor(rows: BulkImportRowDto[]) {
    super();
    this.rows = rows;
  }

  protected parseFileContent(_buffer: Buffer): BulkImportRowDto[] {
    return this.rows;
  }
}

describe("FileParser", () => {
  describe("validateFileSize", () => {
    it("accepts files under 10MB", () => {
      const parser = new TestParser([{ a: "1" }]);
      const buffer = Buffer.alloc(1024); // 1KB

      expect(() => parser.parse(buffer)).not.toThrow();
    });

    it("rejects files over 10MB", () => {
      const parser = new TestParser([]);
      const buffer = Buffer.alloc(10 * 1024 * 1024 + 1);

      expect(() => parser.parse(buffer)).toThrow(/File size.*exceeds maximum/);
    });

    it("accepts files exactly at 10MB", () => {
      const parser = new TestParser([{ a: "1" }]);
      const buffer = Buffer.alloc(10 * 1024 * 1024);

      expect(() => parser.parse(buffer)).not.toThrow();
    });
  });

  describe("validateRows", () => {
    it("accepts valid rows", () => {
      const parser = new TestParser([
        { name: "John", age: "30" },
        { name: "Jane", age: "25" },
      ]);
      const buffer = Buffer.alloc(1024); // 1KB

      expect(() => parser.parse(buffer)).not.toThrow();
    });

    it("rejects empty rows", () => {
      const parser = new TestParser([]);
      const buffer = Buffer.alloc(1024); // 1KB

      expect(() => parser.parse(buffer)).toThrow(/File must contain at least 1 data row/);
    });

    it("rejects rows exceeding 1000", () => {
      const rows: BulkImportRowDto[] = Array.from({ length: 1001 }, (_, i) => ({ col: `val${i}` }));
      const parser = new TestParser(rows);
      const buffer = Buffer.alloc(1024); // 1KB

      expect(() => parser.parse(buffer)).toThrow(
        /File contains 1001 rows, maximum allowed is 1000/,
      );
    });

    it("rejects inconsistent column counts", () => {
      const parser = new TestParser([
        { a: "1", b: "2", c: "3" },
        { a: "4", b: "5" },
      ]);
      const buffer = Buffer.alloc(1024); // 1KB

      expect(() => parser.parse(buffer)).toThrow(/Row 3 has 2 columns, expected 3/);
    });
  });

  describe("transformValues", () => {
    it("converts undefined to null", () => {
      const rows: BulkImportRowDto[] = [{ a: undefined } as unknown as BulkImportRowDto];
      const parser = new TestParser(rows);
      const buffer = Buffer.alloc(1024); // 1KB

      const result = parser.parse(buffer);

      expect(result.rows[0].a).toBeNull();
    });

    it("converts null to null", () => {
      const rows: BulkImportRowDto[] = [{ a: null }];
      const parser = new TestParser(rows);
      const buffer = Buffer.alloc(1024); // 1KB

      const result = parser.parse(buffer);

      expect(result.rows[0].a).toBeNull();
    });

    it("converts empty string to null", () => {
      const rows: BulkImportRowDto[] = [{ a: "" }];
      const parser = new TestParser(rows);
      const buffer = Buffer.alloc(1024); // 1KB
      const result = parser.parse(buffer);

      expect(result.rows[0].a).toBeNull();
    });

    it("converts numbers to strings", () => {
      const rows: BulkImportRowDto[] = [
        { a: 123 as unknown as string | null, b: 3.14 as unknown as string | null },
      ];
      const parser = new TestParser(rows);
      const buffer = Buffer.alloc(1024); // 1KB
      const result = parser.parse(buffer);

      expect(result.rows[0].a).toBe("123");
      expect(result.rows[0].b).toBe("3.14");
    });

    it("keeps strings as strings", () => {
      const rows: BulkImportRowDto[] = [{ a: "hello" }];
      const parser = new TestParser(rows);
      const buffer = Buffer.alloc(1024); // 1KB
      const result = parser.parse(buffer);

      expect(result.rows[0].a).toBe("hello");
    });
  });

  describe("parse (template method)", () => {
    it("calls validateFileSize, parseFileContent, and postProcessRows", () => {
      const rows: BulkImportRowDto[] = [{ a: "1" }, { a: "2" }];
      const parser = new TestParser(rows);
      const buffer = Buffer.from("test");

      const result = parser.parse(buffer);

      expect(result.rows).toEqual([{ a: "1" }, { a: "2" }]);
    });

    it("throws error for large files before parsing", () => {
      const parser = new TestParser([]);
      const buffer = Buffer.alloc(10 * 1024 * 1024 + 1);

      expect(() => parser.parse(buffer)).toThrow(/File size.*exceeds maximum/);
    });
  });
});
