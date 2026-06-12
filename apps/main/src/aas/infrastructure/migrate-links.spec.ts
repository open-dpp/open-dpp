import { DataTypeDef, KeyTypes, ReferenceTypes } from "@open-dpp/dto";
import { migrateSubmodelElementLinks, reverseMigrateSubmodelElementLinks } from "./migrate-links";

describe("migrate-links", () => {
  describe("migrateSubmodelElementLinks", () => {
    it("should migrate a ReferenceElement with ExternalReference to a Property with AnyUri", () => {
      const input = {
        idShort: "link",
        modelType: KeyTypes.ReferenceElement,
        value: {
          type: ReferenceTypes.ExternalReference,
          keys: [
            {
              type: "GlobalReference",
              value: "https://example.com",
            },
          ],
        },
      };

      const expected = {
        idShort: "link",
        modelType: KeyTypes.Property,
        valueType: DataTypeDef.AnyUri,
        value: "https://example.com",
      };

      expect(migrateSubmodelElementLinks(input)).toEqual(expected);
    });

    it("should migrate a ReferenceElement with null value to a Property with AnyUri", () => {
      const input = {
        idShort: "link",
        modelType: KeyTypes.ReferenceElement,
        value: null,
      };

      const expected = {
        idShort: "link",
        modelType: KeyTypes.Property,
        valueType: DataTypeDef.AnyUri,
        value: null,
      };

      expect(migrateSubmodelElementLinks(input)).toEqual(expected);
    });

    it("should not migrate a ReferenceElement with ModelReference", () => {
      const input = {
        idShort: "ref",
        modelType: KeyTypes.ReferenceElement,
        value: {
          type: ReferenceTypes.ModelReference,
          keys: [
            {
              type: "Submodel",
              value: "some-id",
            },
          ],
        },
      };

      expect(migrateSubmodelElementLinks(input)).toEqual(input);
    });

    it("should recurse into SubmodelElementCollection", () => {
      const input = {
        idShort: "smc",
        modelType: KeyTypes.SubmodelElementCollection,
        value: [
          {
            idShort: "link",
            modelType: KeyTypes.ReferenceElement,
            value: {
              type: ReferenceTypes.ExternalReference,
              keys: [
                {
                  type: "GlobalReference",
                  value: "https://example.com",
                },
              ],
            },
          },
        ],
      };

      const result = migrateSubmodelElementLinks(input);
      expect(result.value[0].modelType).toBe(KeyTypes.Property);
      expect(result.value[0].valueType).toBe(DataTypeDef.AnyUri);
      expect(result.value[0].value).toBe("https://example.com");
    });
  });

  describe("reverseMigrateSubmodelElementLinks", () => {
    it("should reverse migrate a Property with AnyUri to a ReferenceElement with ExternalReference", () => {
      const input = {
        idShort: "link",
        modelType: KeyTypes.Property,
        valueType: DataTypeDef.AnyUri,
        value: "https://example.com",
      };

      const expected = {
        idShort: "link",
        modelType: KeyTypes.ReferenceElement,
        value: {
          type: ReferenceTypes.ExternalReference,
          keys: [
            {
              type: KeyTypes.GlobalReference,
              value: "https://example.com",
            },
          ],
        },
      };

      expect(reverseMigrateSubmodelElementLinks(input)).toEqual(expected);
    });

    it("should reverse migrate a Property with AnyUri and null value to a ReferenceElement", () => {
      const input = {
        idShort: "link",
        modelType: KeyTypes.Property,
        valueType: DataTypeDef.AnyUri,
        value: null,
      };

      const expected = {
        idShort: "link",
        modelType: KeyTypes.ReferenceElement,
        value: null,
      };

      expect(reverseMigrateSubmodelElementLinks(input)).toEqual(expected);
    });

    it("should not reverse migrate a regular Property", () => {
      const input = {
        idShort: "prop",
        modelType: KeyTypes.Property,
        valueType: DataTypeDef.String,
        value: "hello",
      };

      expect(reverseMigrateSubmodelElementLinks(input)).toEqual(input);
    });

    it("should recurse into SubmodelElementCollection", () => {
      const input = {
        idShort: "smc",
        modelType: KeyTypes.SubmodelElementCollection,
        value: [
          {
            idShort: "link",
            modelType: KeyTypes.Property,
            valueType: DataTypeDef.AnyUri,
            value: "https://example.com",
          },
        ],
      };

      const result = reverseMigrateSubmodelElementLinks(input);
      expect(result.value[0].modelType).toBe(KeyTypes.ReferenceElement);
      expect(result.value[0].value.type).toBe(ReferenceTypes.ExternalReference);
      expect(result.value[0].value.keys[0].value).toBe("https://example.com");
    });
  });
});
