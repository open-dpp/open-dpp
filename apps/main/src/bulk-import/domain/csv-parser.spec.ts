import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CsvParser } from "./csv-parser";

describe("CsvParser", () => {
  let parser: CsvParser;

  beforeEach(() => {
    parser = new CsvParser();
  });

  describe("parse", () => {
    it("parses a simple CSV with comma delimiter", () => {
      const csvContent = `name,age,city\nJohn,30,NYC\nJane,25,LA`;
      const buffer = Buffer.from(csvContent, "utf8");

      const result = parser.parse(buffer);

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].name).toBe("John");
      expect(result.rows[0].age).toBe("30");
      expect(result.rows[0].city).toBe("NYC");
      expect(result.rows[1].name).toBe("Jane");
      expect(result.rows[1].age).toBe("25");
      expect(result.rows[1].city).toBe("LA");
    });

    it("parses CSV with semicolon delimiter", () => {
      const csvContent = `name;age;city\nJohn;30;NYC\nJane;25;LA`;
      const buffer = Buffer.from(csvContent, "utf8");

      const result = parser.parse(buffer);

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].name).toBe("John");
      expect(result.rows[0].age).toBe("30");
      expect(result.rows[0].city).toBe("NYC");
    });

    it("parses CSV with tab delimiter", () => {
      const csvContent = `name\tage\tcity\nJohn\t30\tNYC\nJane\t25\tLA`;
      const buffer = Buffer.from(csvContent, "utf8");

      const result = parser.parse(buffer);

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual({ name: "John", age: "30", city: "NYC" });
    });

    it("parses CSV with pipe delimiter", () => {
      const csvContent = `name|age|city\nJohn|30|NYC\nJane|25|LA`;
      const buffer = Buffer.from(csvContent, "utf8");

      const result = parser.parse(buffer);

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual({ name: "John", age: "30", city: "NYC" });
    });

    it("handles empty cells as null", () => {
      const csvContent = `name,age,city\nJohn,30,\nJane,,LA`;
      const buffer = Buffer.from(csvContent, "utf8");

      const result = parser.parse(buffer);

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].city).toBeNull();
      expect(result.rows[1].age).toBeNull();
    });

    it("handles quoted fields with commas", () => {
      const csvContent = `name,description\nJohn,"A person, who lives"\nJane,"Another person"`;
      const buffer = Buffer.from(csvContent, "utf8");

      const result = parser.parse(buffer);

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].description).toBe("A person, who lives");
    });

    it("handles quoted fields with quotes", () => {
      const csvContent = `name,quote\nJohn,"He said "hello""`;
      const buffer = Buffer.from(csvContent, "utf8");

      const result = parser.parse(buffer);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].quote).toBe('He said "hello"');
    });

    it("trims whitespace from header values", () => {
      const csvContent = ` name , age , city \n John , 30 , NYC `;
      const buffer = Buffer.from(csvContent, "utf8");

      const result = parser.parse(buffer);

      expect(result.rows[0]).toEqual({ name: "John", age: "30", city: "NYC" });
    });

    it("skips empty lines", () => {
      const csvContent = `name,age\n\nJohn,30\n\nJane,25`;
      const buffer = Buffer.from(csvContent, "utf8");

      const result = parser.parse(buffer);

      expect(result.rows).toHaveLength(2);
    });

    it("parses CSV with BOM (Byte Order Mark)", () => {
      // UTF-8 BOM: EF BB BF
      const bom = Buffer.from([0xef, 0xbb, 0xbf]);
      const csvContent = `name,age\nJohn,30`;
      const buffer = Buffer.concat([bom, Buffer.from(csvContent, "utf8")]);

      const result = parser.parse(buffer);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].name).toBe("John");
    });

    it("rejects files with no data rows (header only)", () => {
      const csvContent = `name,age,city`;
      const buffer = Buffer.from(csvContent, "utf8");

      expect(() => parser.parse(buffer)).toThrow(/File must contain at least 1 data row/);
    });

    it("rejects files with more than 1000 rows", () => {
      const header = "col1,col2";
      const rows = Array.from({ length: 1001 }, (_, i) => `val${i},val${i}`).join("\n");
      const csvContent = `${header}\n${rows}`;
      const buffer = Buffer.from(csvContent, "utf8");

      expect(() => parser.parse(buffer)).toThrow(
        /File contains 1001 rows, maximum allowed is 1000/,
      );
    });

    it("handles files with inconsistent column counts", () => {
      const csvContent = `name,age,city\nJohn,30,90\nJane,25,LA,Extra\nJane,50`;
      const buffer = Buffer.from(csvContent, "utf8");
      const { rows } = parser.parse(buffer);
      expect(rows).toEqual([
        {
          name: "John",
          age: "30",
          city: "90",
        },
        {
          name: "Jane",
          age: "25",
          city: "LA",
        },
        {
          name: "Jane",
          age: "50",
          city: null,
        },
      ]);
    });

    it("handles UTF-8 characters", () => {
      const csvContent = `name,city\nJöhn,Zürich\nJañe,München`;
      const buffer = Buffer.from(csvContent, "utf8");

      const result = parser.parse(buffer);

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].name).toBe("Jöhn");
      expect(result.rows[0].city).toBe("Zürich");
      expect(result.rows[1].name).toBe("Jañe");
      expect(result.rows[1].city).toBe("München");
    });

    it("handles CRLF line endings", () => {
      const csvContent = `name,age\r\nJohn,30\r\nJane,25`;
      const buffer = Buffer.from(csvContent, "utf8");

      const result = parser.parse(buffer);

      expect(result.rows).toHaveLength(2);
    });

    it("handles CR line endings", () => {
      const csvContent = `name,age\rJohn,30\rJane,25`;
      const buffer = Buffer.from(csvContent, "utf8");

      const result = parser.parse(buffer);

      expect(result.rows).toHaveLength(2);
    });

    describe("cell values", () => {
      it.each([
        ["a number with leading zeros", "007"],
        ["a GTIN with a leading zero", "04012345678901"],
        ["a number beyond the safe integer range", "123456789012345678"],
        ["a number in exponent notation", "1e5"],
        ["a percentage", "50%"],
        ["a boolean", "TRUE"],
        ["a date", "2024-01-31"],
        ["a date-time", "2024-01-31T10:00:00Z"],
        ["a time", "12:30"],
        ["a version number", "1.2.3"],
        ["a formula", "=1+1"],
        ["an error value", "#N/A"],
      ])("returns %s as written: %s", (_kind, cell) => {
        const buffer = Buffer.from(`name,value\nItem,${cell}`, "utf8");

        const result = parser.parse(buffer);

        expect(result.rows).toEqual([{ name: "Item", value: cell }]);
      });

      it("returns a quoted decimal comma without the quotes", () => {
        const buffer = Buffer.from(`name,value\nItem,"1,5"`, "utf8");

        const result = parser.parse(buffer);

        expect(result.rows).toEqual([{ name: "Item", value: "1,5" }]);
      });

      it("keeps a decimal comma in a semicolon-delimited file", () => {
        const buffer = Buffer.from(`name;value\nItem;1,5`, "utf8");

        const result = parser.parse(buffer);

        expect(result.rows).toEqual([{ name: "Item", value: "1,5" }]);
      });

      it("keeps a column name as written", () => {
        const buffer = Buffer.from(`007,50%\nfirst,second`, "utf8");

        const result = parser.parse(buffer);

        expect(result.rows).toEqual([{ "007": "first", "50%": "second" }]);
      });

      describe("on hosts in different time zones", () => {
        afterEach(() => {
          vi.unstubAllEnvs();
        });

        // 02:30 on 2024-03-31 does not exist in Europe/Berlin (start of summer time), so a
        // parser that builds a local Date from the cell gives a different result there.
        it.each(["UTC", "Europe/Berlin"])(
          "returns dates and times as written in %s",
          (timeZone) => {
            vi.stubEnv("TZ", timeZone);
            const buffer = Buffer.from(
              `date,dateTime,time\n2024-01-31,2024-03-31T02:30:00,12:30`,
              "utf8",
            );

            const result = parser.parse(buffer);

            expect(result.rows).toEqual([
              { date: "2024-01-31", dateTime: "2024-03-31T02:30:00", time: "12:30" },
            ]);
          },
        );
      });
    });
  });
});
