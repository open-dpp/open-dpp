import { describe, expect, it } from "@jest/globals";
import { JsonParser } from "./json-parser";

describe("JsonParser", () => {
  const parser = new JsonParser();

  describe("parse", () => {
    it("parses a valid JSON array of objects", () => {
      const buffer = Buffer.from(
        JSON.stringify([
          { sku: "A001", name: "Product 1" },
          { sku: "A002", name: "Product 2" },
        ]),
      );

      const result = parser.parse(buffer);

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual({ sku: "A001", name: "Product 1" });
      expect(result.rows[1]).toEqual({ sku: "A002", name: "Product 2" });
    });

    it("parses a single row JSON array", () => {
      const buffer = Buffer.from(JSON.stringify([{ id: "1", value: "test" }]));

      const result = parser.parse(buffer);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toEqual({ id: "1", value: "test" });
    });

    it("parses with numeric and boolean values", () => {
      const buffer = Buffer.from(
        JSON.stringify([
          { id: 123, active: true, price: 99.99 },
          { id: 456, active: false, price: 149.99 },
        ]),
      );

      const result = parser.parse(buffer);

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].id).toBe("123");
      expect(result.rows[0].active).toBe("true");
      expect(result.rows[0].price).toBe("99.99");
      expect(result.rows[1].id).toBe("456");
      expect(result.rows[1].active).toBe("false");
      expect(result.rows[1].price).toBe("149.99");
    });

    it("parses with null values", () => {
      const buffer = Buffer.from(
        JSON.stringify([
          { id: "1", name: null, description: "test" },
          { id: "2", name: "Product", description: null },
        ]),
      );

      const result = parser.parse(buffer);

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].name).toBeNull();
      expect(result.rows[0].description).toBe("test");
      expect(result.rows[1].name).toBe("Product");
      expect(result.rows[1].description).toBeNull();
    });

    it("parses with empty strings", () => {
      const buffer = Buffer.from(JSON.stringify([{ id: "1", name: "", description: "test" }]));

      const result = parser.parse(buffer);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].name).toBeNull();
      expect(result.rows[0].description).toBe("test");
    });

    it("trims whitespace from keys and string values", () => {
      const buffer = Buffer.from(JSON.stringify([{ " id ": "  value  ", "  key  ": "data" }]));

      const result = parser.parse(buffer);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toEqual({ id: "value", key: "data" });
    });

    it("throws error when JSON is not an array", () => {
      const buffer = Buffer.from(JSON.stringify({ sku: "A001" }));

      expect(() => parser.parse(buffer)).toThrow("JSON root must be an array");
    });

    it("throws error when array contains non-object elements", () => {
      const buffer = Buffer.from(JSON.stringify([{ sku: "A001" }, "not an object"]));

      expect(() => parser.parse(buffer)).toThrow(
        "Each JSON array element must be a non-null object",
      );
    });

    it("throws error when array contains null elements", () => {
      const buffer = Buffer.from(JSON.stringify([{ sku: "A001" }, null]));

      expect(() => parser.parse(buffer)).toThrow(
        "Each JSON array element must be a non-null object",
      );
    });

    it("throws error when array contains array elements", () => {
      const buffer = Buffer.from(JSON.stringify([{ sku: "A001" }, ["nested", "array"]]));

      expect(() => parser.parse(buffer)).toThrow(
        "Each JSON array element must be a non-null object",
      );
    });

    it("throws error for empty array", () => {
      const buffer = Buffer.from(JSON.stringify([]));

      expect(() => parser.parse(buffer)).toThrow("File must contain at least 1 data row");
    });

    it("throws error when rows exceed maximum", () => {
      const rows = Array.from({ length: 1001 }, (_, i) => ({ id: String(i) }));
      const buffer = Buffer.from(JSON.stringify(rows));

      expect(() => parser.parse(buffer)).toThrow(
        "File contains 1001 rows, maximum allowed is 1000",
      );
    });

    it("throws error when rows have inconsistent columns", () => {
      const buffer = Buffer.from(JSON.stringify([{ id: "1", name: "Product 1" }, { id: "2" }]));

      expect(() => parser.parse(buffer)).toThrow("Row 3 has 1 columns, expected 2");
    });

    it("throws error for malformed JSON", () => {
      const buffer = Buffer.from("{not valid json");

      expect(() => parser.parse(buffer)).toThrow();
    });
  });
});
