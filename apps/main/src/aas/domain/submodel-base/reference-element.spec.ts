import { expect } from "@jest/globals";
import { ValueError } from "@open-dpp/exception";
import { propertyPlainFactory } from "@open-dpp/testing";
import { Property } from "./property";
import { ReferenceElement } from "./reference-element";

describe("referenceElement", () => {
  it("should add submodel element", () => {
    const referenceElement = ReferenceElement.create({ idShort: "b1" });
    expect(() => referenceElement.addSubmodelElement(Property.fromPlain(propertyPlainFactory.build()))).toThrow(
      new ValueError("ReferenceElement cannot contain submodel elements"),
    );
  });

  it("should get submodel elements", () => {
    const referenceElement = ReferenceElement.create({ idShort: "b1" });
    expect([...referenceElement.getSubmodelElements()]).toEqual([]);
  });
});
