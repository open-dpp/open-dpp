import {
  UniqueProductIdentifierListItemDtoSchema,
  UniqueProductIdentifierListDtoSchema,
  UniqueProductIdentifierPaginationDtoSchema,
} from "./unique-product-identifier-list-item.dto";

/**
 * Slice 9: UniqueProductIdentifierListItemDtoSchema + list schema (read shape).
 *
 * Tests the read DTO for the UPI list endpoint. No GS1 data attributes appear on
 * this schema — the list item is a display-only snapshot.
 */
describe("UniqueProductIdentifierListItemDtoSchema", () => {
  const VALID_GTIN14 = "04006381333931"; // 14-digit, valid check digit

  describe("GS1 row", () => {
    it("parses a full GS1 row with gtin, batch, serial and granularity=item", () => {
      const input = {
        uuid: "550e8400-e29b-41d4-a716-446655440000",
        referenceId: "550e8400-e29b-41d4-a716-446655440001",
        type: "GS1",
        gtin: VALID_GTIN14,
        batch: "LOT-42",
        serial: "SN-001",
        granularity: "item",
        digitalLink: "https://id.example.com/01/04006381333931/10/LOT-42/21/SN-001",
        passportPublished: false,
      };
      const result = UniqueProductIdentifierListItemDtoSchema.parse(input);
      expect(result.type).toBe("GS1");
      expect(result.gtin).toBe(VALID_GTIN14);
      expect(result.batch).toBe("LOT-42");
      expect(result.serial).toBe("SN-001");
      expect(result.granularity).toBe("item");
      expect(result.digitalLink).toBe(
        "https://id.example.com/01/04006381333931/10/LOT-42/21/SN-001",
      );
      expect(result.passportPublished).toBe(false);
      expect(result.uuid).toBe("550e8400-e29b-41d4-a716-446655440000");
      expect(result.referenceId).toBe("550e8400-e29b-41d4-a716-446655440001");
    });

    it("parses a GS1 row with granularity=batch (no serial)", () => {
      const input = {
        uuid: "550e8400-e29b-41d4-a716-446655440000",
        referenceId: "550e8400-e29b-41d4-a716-446655440001",
        type: "GS1",
        gtin: VALID_GTIN14,
        batch: "LOT-42",
        serial: null,
        granularity: "batch",
        digitalLink: "https://id.example.com/01/04006381333931/10/LOT-42",
        passportPublished: true,
      };
      const result = UniqueProductIdentifierListItemDtoSchema.parse(input);
      expect(result.granularity).toBe("batch");
      expect(result.passportPublished).toBe(true);
    });

    it("accepts digitalLink as null", () => {
      const input = {
        uuid: "550e8400-e29b-41d4-a716-446655440000",
        referenceId: "550e8400-e29b-41d4-a716-446655440001",
        type: "GS1",
        gtin: VALID_GTIN14,
        batch: null,
        serial: null,
        granularity: "model",
        digitalLink: null,
        passportPublished: false,
      };
      const result = UniqueProductIdentifierListItemDtoSchema.parse(input);
      expect(result.digitalLink).toBeNull();
    });

    it("rejects a GS1 row with a non-normalized 13-digit gtin (must be GTIN-14)", () => {
      const input = {
        uuid: "550e8400-e29b-41d4-a716-446655440000",
        referenceId: "550e8400-e29b-41d4-a716-446655440001",
        type: "GS1",
        gtin: "4006381333931", // 13-digit — not GTIN-14
        batch: null,
        serial: null,
        granularity: "model",
        digitalLink: null,
        passportPublished: false,
      };
      expect(() => UniqueProductIdentifierListItemDtoSchema.parse(input)).toThrow();
    });
  });

  describe("system (OPEN_DPP_UUID) row", () => {
    it("parses a system row with all gs1 fields null and granularity null", () => {
      const input = {
        uuid: "550e8400-e29b-41d4-a716-446655440000",
        referenceId: "550e8400-e29b-41d4-a716-446655440001",
        type: "OPEN_DPP_UUID",
        gtin: null,
        batch: null,
        serial: null,
        granularity: null,
        passportPublished: false,
      };
      const result = UniqueProductIdentifierListItemDtoSchema.parse(input);
      expect(result.type).toBe("OPEN_DPP_UUID");
      expect(result.gtin).toBeNull();
      expect(result.batch).toBeNull();
      expect(result.serial).toBeNull();
      expect(result.granularity).toBeNull();
    });
  });

  describe("GTIN/EAN row", () => {
    it("parses a GTIN row with gtin present, granularity model, no digitalLink required", () => {
      const input = {
        uuid: "550e8400-e29b-41d4-a716-446655440000",
        referenceId: "550e8400-e29b-41d4-a716-446655440001",
        type: "GTIN",
        gtin: VALID_GTIN14,
        batch: null,
        serial: null,
        granularity: "model",
        passportPublished: false,
        // digitalLink intentionally omitted
      };
      const result = UniqueProductIdentifierListItemDtoSchema.parse(input);
      expect(result.type).toBe("GTIN");
      expect(result.gtin).toBe(VALID_GTIN14);
      expect(result.granularity).toBe("model");
    });
  });

  describe("rejections", () => {
    it("rejects an unknown type", () => {
      const input = {
        uuid: "550e8400-e29b-41d4-a716-446655440000",
        referenceId: "550e8400-e29b-41d4-a716-446655440001",
        type: "UNKNOWN_TYPE",
        gtin: null,
        batch: null,
        serial: null,
        granularity: null,
        passportPublished: false,
      };
      expect(() => UniqueProductIdentifierListItemDtoSchema.parse(input)).toThrow();
    });
  });

  describe("no GS1 data attributes on this schema", () => {
    it("does not expose a gs1DataAttributes field", () => {
      const schema = UniqueProductIdentifierListItemDtoSchema;
      // The list-item schema must NOT have gs1DataAttributes — verify by checking
      // that parsing an object with gs1DataAttributes strips it (not an error, just stripped).
      // The important thing is the schema shape does not include it.
      const input = {
        uuid: "550e8400-e29b-41d4-a716-446655440000",
        referenceId: "550e8400-e29b-41d4-a716-446655440001",
        type: "GS1",
        gtin: VALID_GTIN14,
        batch: null,
        serial: null,
        granularity: "model",
        digitalLink: null,
        passportPublished: false,
        gs1DataAttributes: { "17": "251231" }, // should be stripped/ignored
      };
      const result = schema.parse(input);
      expect((result as Record<string, unknown>).gs1DataAttributes).toBeUndefined();
    });
  });
});

describe("UniqueProductIdentifierListDtoSchema", () => {
  const VALID_GTIN14 = "04006381333931";

  it("parses an array of items", () => {
    const input = [
      {
        uuid: "550e8400-e29b-41d4-a716-446655440000",
        referenceId: "550e8400-e29b-41d4-a716-446655440001",
        type: "GS1",
        gtin: VALID_GTIN14,
        batch: null,
        serial: null,
        granularity: "model",
        digitalLink: null,
        passportPublished: false,
      },
    ];
    const result = UniqueProductIdentifierListDtoSchema.parse(input);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
  });

  it("parses an empty array", () => {
    const result = UniqueProductIdentifierListDtoSchema.parse([]);
    expect(result).toEqual([]);
  });

  it("has .element equal to the item schema", () => {
    expect(UniqueProductIdentifierListDtoSchema.element).toBe(
      UniqueProductIdentifierListItemDtoSchema,
    );
  });
});

describe("UniqueProductIdentifierPaginationDtoSchema", () => {
  const VALID_GTIN14 = "04006381333931";
  const item = {
    uuid: "550e8400-e29b-41d4-a716-446655440000",
    referenceId: "550e8400-e29b-41d4-a716-446655440001",
    type: "GS1",
    gtin: VALID_GTIN14,
    batch: null,
    serial: null,
    granularity: "model",
    digitalLink: null,
    passportPublished: false,
  };

  it("parses an envelope with a non-null cursor and a result array", () => {
    const result = UniqueProductIdentifierPaginationDtoSchema.parse({
      paging_metadata: { cursor: "cursor-token" },
      result: [item],
    });
    expect(result.paging_metadata.cursor).toBe("cursor-token");
    expect(result.result).toHaveLength(1);
    expect(result.result[0].uuid).toBe(item.uuid);
  });

  it("parses an envelope with a null cursor and an empty result", () => {
    const result = UniqueProductIdentifierPaginationDtoSchema.parse({
      paging_metadata: { cursor: null },
      result: [],
    });
    expect(result.paging_metadata.cursor).toBeNull();
    expect(result.result).toEqual([]);
  });

  it("rejects an envelope missing paging_metadata", () => {
    expect(() => UniqueProductIdentifierPaginationDtoSchema.parse({ result: [] })).toThrow();
  });
});
