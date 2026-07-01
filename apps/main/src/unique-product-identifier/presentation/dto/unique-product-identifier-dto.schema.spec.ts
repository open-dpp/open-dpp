import {
  CreateGs1UniqueProductIdentifierRequestSchema as DtoCreateSchema,
  ExternalIdentifierType as DtoExternalIdentifierType,
  ExternalIdentifierTypeSchema as DtoExternalIdentifierTypeSchema,
  UniqueProductIdentifierListItemDtoSchema as DtoListItemSchema,
  UpdateGs1UniqueProductIdentifierRequestSchema as DtoUpdateSchema,
} from "@open-dpp/dto";
import {
  CreateGs1UniqueProductIdentifierRequestSchema,
  ExternalIdentifierType,
  ExternalIdentifierTypeSchema,
  UniqueProductIdentifierDtoSchema,
  UniqueProductIdentifierListItemDtoSchema,
  UpdateGs1UniqueProductIdentifierRequestSchema,
} from "./unique-product-identifier-dto.schema";

describe("Slice 23 — UPI presentation DTO re-exports shared schemas", () => {
  describe("symbol identity: re-exported schemas are the same object as @open-dpp/dto", () => {
    it("UniqueProductIdentifierListItemDtoSchema === @open-dpp/dto symbol", () => {
      expect(UniqueProductIdentifierListItemDtoSchema).toBe(DtoListItemSchema);
    });

    it("CreateGs1UniqueProductIdentifierRequestSchema === @open-dpp/dto symbol", () => {
      expect(CreateGs1UniqueProductIdentifierRequestSchema).toBe(DtoCreateSchema);
    });

    it("UpdateGs1UniqueProductIdentifierRequestSchema === @open-dpp/dto symbol", () => {
      expect(UpdateGs1UniqueProductIdentifierRequestSchema).toBe(DtoUpdateSchema);
    });

    it("ExternalIdentifierType === @open-dpp/dto symbol", () => {
      expect(ExternalIdentifierType).toBe(DtoExternalIdentifierType);
    });

    it("ExternalIdentifierTypeSchema === @open-dpp/dto symbol", () => {
      expect(ExternalIdentifierTypeSchema).toBe(DtoExternalIdentifierTypeSchema);
    });
  });

  describe("parse parity: local re-exports parse identically to @open-dpp/dto symbols", () => {
    const createFixture = {
      referenceId: "550e8400-e29b-41d4-a716-446655440000",
      gtin: "4006381333931",
    };

    it("CreateGs1UniqueProductIdentifierRequestSchema parses the fixture identically", () => {
      const local = CreateGs1UniqueProductIdentifierRequestSchema.parse(createFixture);
      const shared = DtoCreateSchema.parse(createFixture);
      expect(local).toEqual(shared);
    });

    const updateFixture = {
      gtin: "4006381333931",
    };

    it("UpdateGs1UniqueProductIdentifierRequestSchema parses the fixture identically", () => {
      const local = UpdateGs1UniqueProductIdentifierRequestSchema.parse(updateFixture);
      const shared = DtoUpdateSchema.parse(updateFixture);
      expect(local).toEqual(shared);
    });

    const listItemFixture = {
      uuid: "550e8400-e29b-41d4-a716-446655440001",
      referenceId: "550e8400-e29b-41d4-a716-446655440000",
      type: "GS1",
      gtin: "04006381333931",
      batch: null,
      serial: null,
      granularity: "model",
      digitalLink: null,
      passportPublished: false,
    };

    it("UniqueProductIdentifierListItemDtoSchema parses the fixture identically", () => {
      const local = UniqueProductIdentifierListItemDtoSchema.parse(listItemFixture);
      const shared = DtoListItemSchema.parse(listItemFixture);
      expect(local).toEqual(shared);
    });
  });

  describe("legacy UniqueProductIdentifierDtoSchema still validates {uuid,referenceId,type,gtin}", () => {
    it("parses a minimal GS1 row", () => {
      const result = UniqueProductIdentifierDtoSchema.parse({
        uuid: "550e8400-e29b-41d4-a716-446655440001",
        referenceId: "550e8400-e29b-41d4-a716-446655440000",
        type: "GS1",
        gtin: "04006381333931",
      });
      expect(result.uuid).toBe("550e8400-e29b-41d4-a716-446655440001");
      expect(result.type).toBe("GS1");
      expect(result.gtin).toBe("04006381333931");
    });

    it("defaults type to OPEN_DPP_UUID when absent", () => {
      const result = UniqueProductIdentifierDtoSchema.parse({
        uuid: "550e8400-e29b-41d4-a716-446655440001",
        referenceId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.type).toBe("OPEN_DPP_UUID");
    });

    it("rejects an unknown type", () => {
      expect(() =>
        UniqueProductIdentifierDtoSchema.parse({
          uuid: "550e8400-e29b-41d4-a716-446655440001",
          referenceId: "550e8400-e29b-41d4-a716-446655440000",
          type: "UNKNOWN",
        }),
      ).toThrow();
    });
  });

  describe("ExternalIdentifierType / ExternalIdentifierTypeSchema remain exported", () => {
    it("ExternalIdentifierType has OPEN_DPP_UUID, GS1, GTIN, EAN", () => {
      expect(ExternalIdentifierType.OPEN_DPP_UUID).toBe("OPEN_DPP_UUID");
      expect(ExternalIdentifierType.GS1).toBe("GS1");
      expect(ExternalIdentifierType.GTIN).toBe("GTIN");
      expect(ExternalIdentifierType.EAN).toBe("EAN");
    });

    it("ExternalIdentifierTypeSchema accepts all four values", () => {
      expect(() => ExternalIdentifierTypeSchema.parse("OPEN_DPP_UUID")).not.toThrow();
      expect(() => ExternalIdentifierTypeSchema.parse("GS1")).not.toThrow();
      expect(() => ExternalIdentifierTypeSchema.parse("GTIN")).not.toThrow();
      expect(() => ExternalIdentifierTypeSchema.parse("EAN")).not.toThrow();
    });

    it("ExternalIdentifierTypeSchema rejects unknown values", () => {
      expect(() => ExternalIdentifierTypeSchema.parse("FOO")).toThrow();
    });
  });
});
