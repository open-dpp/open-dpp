import { describe, expect, it } from "vitest";
import {
  DataTypeDef,
  KeyTypes,
  PresentationComponentName,
  type PresentationComponentNameType,
  type PropertyResponseDto,
  type SubmodelElementResponseDto,
} from "@open-dpp/dto";
import {
  PRESENTATION_COMPONENTS,
  type PresentationComponentEntry,
} from "./presentation-components";
import { type LeafElement, resolveI18nKey } from "./presentation-element-helpers";

type TestElement = SubmodelElementResponseDto & LeafElement;

function makeProperty(overrides: Partial<PropertyResponseDto> = {}): TestElement {
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
  return { ...property, modelType: KeyTypes.Property };
}

function makeUnrelatedContainer(): TestElement {
  return {
    modelType: KeyTypes.SubmodelElementCollection,
    idShort: "Container",
    displayName: [],
    description: [],
    supplementalSemanticIds: [],
    qualifiers: [],
    embeddedDataSpecifications: [],
    value: [],
  };
}

const entries = Object.entries(PRESENTATION_COMPONENTS) as [
  PresentationComponentNameType,
  PresentationComponentEntry,
][];

describe.each(entries)("registry invariants: %s", (name, entry) => {
  it("appliesTo returns a boolean", () => {
    expect(typeof entry.appliesTo(makeProperty())).toBe("boolean");
  });

  it("appliesTo is false for an unrelated container element", () => {
    expect(entry.appliesTo(makeUnrelatedContainer())).toBe(false);
  });

  it("sampleElement passes through unchanged when appliesTo is false", () => {
    const container = makeUnrelatedContainer();
    const result = entry.sampleElement(container);
    expect(result.usedSample).toBe(false);
    expect(result.element).toBe(container);
  });

  it("sampleElement does not mutate the input element", () => {
    const property = makeProperty({ value: null, valueType: DataTypeDef.Long });
    const snapshot = JSON.parse(JSON.stringify(property));
    entry.sampleElement(property);
    expect(JSON.parse(JSON.stringify(property))).toEqual(snapshot);
  });

  it("resolveI18nKey returns a non-empty string under aasEditor.presentationTab", () => {
    const key = resolveI18nKey(name, entry);
    expect(key).toMatch(/^aasEditor\.presentationTab\..+/);
  });
});

describe("resolveI18nKey", () => {
  it("derives a camelCase default key from the component name", () => {
    expect(resolveI18nKey("BigNumber" as PresentationComponentNameType, {})).toBe(
      "aasEditor.presentationTab.bigNumber",
    );
  });

  it("uses the explicit i18nKey when set", () => {
    expect(
      resolveI18nKey("BigNumber" as PresentationComponentNameType, {
        i18nKey: "custom.translation.key",
      }),
    ).toBe("custom.translation.key");
  });
});

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
      expect((result.element as { value?: string | null }).value).toBe("1234567");
    });

    it("samples a decimal when value is null and valueType is Decimal", () => {
      const result = bigNumber.sampleElement(
        makeProperty({ value: null, valueType: DataTypeDef.Decimal }),
      );
      expect(result.usedSample).toBe(true);
      expect((result.element as { value?: string | null }).value).toBe("1234567.89");
    });

    it("samples when value is empty string", () => {
      const result = bigNumber.sampleElement(
        makeProperty({ value: "", valueType: DataTypeDef.Float }),
      );
      expect(result.usedSample).toBe(true);
      expect((result.element as { value?: string | null }).value).toBe("1234567.89");
    });

    it("samples when value is non-numeric", () => {
      const result = bigNumber.sampleElement(
        makeProperty({ value: "abc", valueType: DataTypeDef.Double }),
      );
      expect(result.usedSample).toBe(true);
      expect((result.element as { value?: string | null }).value).toBe("1234567.89");
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
      expect((result.element as { value?: string | null }).value).toBe("1234567");
    });

    it.each([DataTypeDef.Float, DataTypeDef.Double])(
      "samples a decimal for valueType %s",
      (valueType) => {
        const result = bigNumber.sampleElement(makeProperty({ value: null, valueType }));
        expect(result.usedSample).toBe(true);
        expect((result.element as { value?: string | null }).value).toBe("1234567.89");
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
      expect(result.element.idShort).toBe("MyField");
      expect(result.element.displayName).toEqual([{ language: "en", text: "My Custom Label" }]);
      expect((result.element as { value?: string | null }).value).toBe("1234567.89");
    });
  });
});
