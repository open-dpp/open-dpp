import { describe, expect, it } from "vitest";
import { DataTypeDef, KeyTypes, PresentationComponentName } from "@open-dpp/dto";
import type { PropertyResponseDto, SubmodelElementResponseDto } from "@open-dpp/dto";
import { PRESENTATION_COMPONENTS } from "./presentation-components";

function makeProperty(
  overrides: Partial<PropertyResponseDto> = {},
): SubmodelElementResponseDto {
  const property: PropertyResponseDto = {
    idShort: "Revenue",
    valueType: DataTypeDef.Decimal,
    value: null,
    displayName: [{ language: "en", text: "Annual Revenue" }],
    description: [],
    extensions: [],
    supplementalSemanticIds: [],
    qualifiers: [],
    embeddedDataSpecifications: [],
    ...overrides,
  };
  return { ...property, modelType: KeyTypes.Property } as unknown as SubmodelElementResponseDto;
}

const bigNumber = PRESENTATION_COMPONENTS[PresentationComponentName.BigNumber];

describe("BigNumber.sampleElement", () => {
  describe("real values pass through unchanged", () => {
    it('keeps "0" as a real value (zero is valid)', () => {
      const element = makeProperty({ value: "0", valueType: DataTypeDef.Long });
      const result = bigNumber.sampleElement(element);
      expect(result.usedSample).toBe(false);
      expect(result.element).toBe(element);
    });

    it("keeps a populated long integer", () => {
      const element = makeProperty({ value: "1500000", valueType: DataTypeDef.Long });
      const result = bigNumber.sampleElement(element);
      expect(result.usedSample).toBe(false);
      expect(result.element).toBe(element);
    });

    it("keeps a populated decimal", () => {
      const element = makeProperty({ value: "1234.56", valueType: DataTypeDef.Decimal });
      const result = bigNumber.sampleElement(element);
      expect(result.usedSample).toBe(false);
      expect(result.element).toBe(element);
    });
  });

  describe("missing values get type-aware samples", () => {
    it("samples an integer when value is null and valueType is Long", () => {
      const result = bigNumber.sampleElement(
        makeProperty({ value: null, valueType: DataTypeDef.Long }),
      );
      expect(result.usedSample).toBe(true);
      expect((result.element as unknown as PropertyResponseDto).value).toBe("1234567");
    });

    it("samples a decimal when value is null and valueType is Decimal", () => {
      const result = bigNumber.sampleElement(
        makeProperty({ value: null, valueType: DataTypeDef.Decimal }),
      );
      expect(result.usedSample).toBe(true);
      expect((result.element as unknown as PropertyResponseDto).value).toBe("1234567.89");
    });

    it("samples when value is empty string", () => {
      const result = bigNumber.sampleElement(
        makeProperty({ value: "", valueType: DataTypeDef.Float }),
      );
      expect(result.usedSample).toBe(true);
      expect((result.element as unknown as PropertyResponseDto).value).toBe("1234567.89");
    });

    it("samples when value is non-numeric", () => {
      const result = bigNumber.sampleElement(
        makeProperty({ value: "abc", valueType: DataTypeDef.Double }),
      );
      expect(result.usedSample).toBe(true);
      expect((result.element as unknown as PropertyResponseDto).value).toBe("1234567.89");
    });

    it.each([
      DataTypeDef.Int,
      DataTypeDef.Short,
      DataTypeDef.Byte,
      DataTypeDef.UnsignedLong,
      DataTypeDef.UnsignedInt,
    ])("samples an integer for valueType %s", (valueType) => {
      const result = bigNumber.sampleElement(makeProperty({ value: null, valueType }));
      expect(result.usedSample).toBe(true);
      expect((result.element as unknown as PropertyResponseDto).value).toBe("1234567");
    });

    it.each([DataTypeDef.Float, DataTypeDef.Double])(
      "samples a decimal for valueType %s",
      (valueType) => {
        const result = bigNumber.sampleElement(makeProperty({ value: null, valueType }));
        expect(result.usedSample).toBe(true);
        expect((result.element as unknown as PropertyResponseDto).value).toBe("1234567.89");
      },
    );
  });

  describe("per-field merge preserves real metadata", () => {
    it("preserves idShort and displayName when sampling value", () => {
      const result = bigNumber.sampleElement(
        makeProperty({
          value: null,
          idShort: "MyField",
          displayName: [{ language: "en", text: "My Custom Label" }],
        }),
      );
      const sampled = result.element as unknown as PropertyResponseDto;
      expect(sampled.idShort).toBe("MyField");
      expect(sampled.displayName).toEqual([{ language: "en", text: "My Custom Label" }]);
      expect(sampled.value).toBe("1234567.89");
    });

    it("does not mutate the original element", () => {
      const original = makeProperty({ value: null, valueType: DataTypeDef.Long });
      const beforeValue = (original as unknown as PropertyResponseDto).value;
      bigNumber.sampleElement(original);
      expect((original as unknown as PropertyResponseDto).value).toBe(beforeValue);
    });
  });

  describe("non-Property elements pass through", () => {
    it("returns unchanged for File modelType", () => {
      const file = {
        modelType: KeyTypes.File,
        idShort: "doc",
        value: null,
      } as unknown as SubmodelElementResponseDto;
      const result = bigNumber.sampleElement(file);
      expect(result.usedSample).toBe(false);
      expect(result.element).toBe(file);
    });
  });
});
