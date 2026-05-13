import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { DataTypeDef, KeyTypes } from "@open-dpp/dto";
import type { PropertyResponseDto, SubmodelElementResponseDto } from "@open-dpp/dto";
import BigNumberValue from "./BigNumberValue.vue";

const localeRef = ref("en-US");

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    locale: localeRef,
    t: (key: string) => key,
  }),
}));

function makeElement(
  value: string | null | undefined,
  overrides: Partial<PropertyResponseDto> = {},
): SubmodelElementResponseDto {
  const element: PropertyResponseDto = {
    idShort: "testProperty",
    valueType: DataTypeDef.Long,
    value,
    displayName: [],
    description: [],
    extensions: [],
    supplementalSemanticIds: [],
    qualifiers: [],
    embeddedDataSpecifications: [],
    ...overrides,
  };
  return { ...element, modelType: KeyTypes.Property };
}

function renderValue(value: string | null | undefined, locale = "en-US"): string {
  localeRef.value = locale;
  const wrapper = mount(BigNumberValue, {
    props: { element: makeElement(value) },
  });
  return wrapper.get('[data-cy="bignumber"] span.text-4xl').text();
}

describe("BigNumberValue", () => {
  beforeEach(() => {
    localeRef.value = "en-US";
  });

  afterEach(() => {
    localeRef.value = "en-US";
  });

  describe("precision preservation", () => {
    it("preserves every digit of a big integer in en-US", () => {
      expect(renderValue("12345678901234567890", "en-US")).toBe("12,345,678,901,234,567,890");
    });

    it("preserves every digit of a big integer in de-DE", () => {
      expect(renderValue("12345678901234567890", "de-DE")).toBe("12.345.678.901.234.567.890");
    });

    it("preserves every fractional digit beyond Number's precision limit", () => {
      // Number("1.23456789012345678") collapses to 1.2345678901234568 — this
      // test fails under the old Number(raw) coercion.
      expect(renderValue("1.23456789012345678", "en-US")).toBe("1.23456789012345678");
    });

    it("uses locale-aware grouping and decimal separator (de-DE)", () => {
      expect(renderValue("1234567.89", "de-DE")).toBe("1.234.567,89");
    });

    it("preserves trailing zeros in the fractional part", () => {
      expect(renderValue("1.10", "en-US")).toBe("1.10");
    });
  });

  describe("signs and edge cases", () => {
    it("formats a negative integer", () => {
      expect(renderValue("-42", "en-US")).toBe("-42");
    });

    it("strips a leading + sign", () => {
      expect(renderValue("+42", "en-US")).toBe("42");
    });

    it("formats a negative decimal with locale separator", () => {
      expect(renderValue("-1234.5", "de-DE")).toBe("-1.234,5");
    });

    it("formats zero", () => {
      expect(renderValue("0", "en-US")).toBe("0");
    });

    it("formats a single-digit integer", () => {
      expect(renderValue("7", "en-US")).toBe("7");
    });
  });

  describe("non-plain input fall-through", () => {
    it("falls back to Intl.NumberFormat for scientific notation", () => {
      const expected = new Intl.NumberFormat("en-US").format(Number("1.5e10"));
      expect(renderValue("1.5e10", "en-US")).toBe(expected);
    });

    it("returns non-numeric strings unchanged", () => {
      expect(renderValue("abc", "en-US")).toBe("abc");
    });
  });

  describe("empty-ish input", () => {
    it("renders empty string for null value", () => {
      expect(renderValue(null)).toBe("");
    });

    it("renders empty string for undefined value", () => {
      expect(renderValue(undefined)).toBe("");
    });

    it("renders empty string for empty string value", () => {
      expect(renderValue("")).toBe("");
    });
  });

  describe("label rendering", () => {
    it("falls back to idShort when no displayName is provided", () => {
      const wrapper = mount(BigNumberValue, {
        props: {
          element: makeElement("42", { idShort: "myProp" }),
        },
      });
      const labelText = wrapper.get('[data-cy="bignumber"] span.uppercase').text();
      expect(labelText).toBe("myProp");
    });

    it("prefers the localized displayName over idShort", () => {
      localeRef.value = "en-US";
      const wrapper = mount(BigNumberValue, {
        props: {
          element: makeElement("42", {
            idShort: "myProp",
            displayName: [{ language: "en", text: "My Property" }],
          }),
        },
      });
      const labelText = wrapper.get('[data-cy="bignumber"] span.uppercase').text();
      expect(labelText).toBe("My Property");
    });
  });
});
