import { DataTypeDef, KeyTypes, ReferenceTypes } from "@open-dpp/dto";
import { migrateSubmodelElementLinks } from "./migrate-links";

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
