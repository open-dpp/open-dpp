import { describe, expect, it } from "vitest";
import { KeyTypes, DataTypeDef } from "@open-dpp/dto";
import { applicableComponentOptions, defaultOption, isLeafElement } from "./element-presentation";

type FirstParam = Parameters<typeof applicableComponentOptions>[0];

const numericProperty = {
  modelType: KeyTypes.Property,
  valueType: DataTypeDef.Double,
  idShort: "numericProp",
  displayName: [],
  description: [],
  supplementalSemanticIds: [],
  qualifiers: [],
  embeddedDataSpecifications: [],
} satisfies FirstParam;

const stringProperty = {
  modelType: KeyTypes.Property,
  valueType: DataTypeDef.String,
  idShort: "stringProp",
  displayName: [],
  description: [],
  supplementalSemanticIds: [],
  qualifiers: [],
  embeddedDataSpecifications: [],
} satisfies FirstParam;

describe("element-presentation", () => {
  it("returns just the default option for elements with no applicable components", () => {
    const t = (k: string) => k;
    const opts = applicableComponentOptions(stringProperty, t);
    expect(opts).toHaveLength(1);
    expect(opts[0]).toEqual(defaultOption(t));
  });

  it("returns BigNumber as an option for numeric Property", () => {
    const t = (k: string) => k;
    const opts = applicableComponentOptions(numericProperty, t);
    const labels = opts.map((o) => o.value);
    expect(labels).toContain("default");
    expect(labels).toContain("BigNumber");
  });

  it("isLeafElement returns true for Property/File/ReferenceElement and false for containers", () => {
    expect(isLeafElement("Property")).toBe(true);
    expect(isLeafElement("File")).toBe(true);
    expect(isLeafElement("ReferenceElement")).toBe(true);
    expect(isLeafElement("Submodel")).toBe(false);
    expect(isLeafElement("SubmodelElementCollection")).toBe(false);
    expect(isLeafElement("SubmodelElementList")).toBe(false);
  });
});
