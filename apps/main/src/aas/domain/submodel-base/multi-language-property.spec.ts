import { expect } from "@jest/globals";
import { ValueError } from "@open-dpp/exception";
import { propertyPlainFactory } from "@open-dpp/testing";
import { MultiLanguageProperty } from "./multi-language-property";
import { Property } from "./property";

describe("multiLanguageProperty", () => {
  it("should add submodel element", () => {
    const multiLanguageProperty = MultiLanguageProperty.create({ idShort: "b1" });
    expect(() => multiLanguageProperty.addSubmodelElement(Property.fromPlain(propertyPlainFactory.build()))).toThrow(
      new ValueError("MultiLanguageProperty cannot contain submodel elements"),
    );
  });

  it("should get submodel elements", () => {
    const multiLanguageProperty = MultiLanguageProperty.create({ idShort: "b1" });
    expect(multiLanguageProperty.getSubmodelElements()).toEqual([]);
  });
});
