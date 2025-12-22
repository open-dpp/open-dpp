import { expect } from "@jest/globals";
import { propertyPlainFactory } from "@open-dpp/testing";
import { Property } from "./property";
import { SubmodelElementCollection } from "./submodel-element-collection";

describe("submodelElementCollection", () => {
  it("should add submodel element", () => {
    const submodelElementCollection = SubmodelElementCollection.create({
      idShort: "idShort",
    });
    const submodelElement = Property.fromPlain(propertyPlainFactory.build());
    submodelElementCollection.addSubmodelElement(submodelElement);
    expect([...submodelElementCollection.getSubmodelElements()]).toEqual([submodelElement]);
    expect(() => submodelElementCollection.addSubmodelElement(submodelElement)).toThrow(
      new Error(`Submodel element with idShort ${submodelElement.idShort} already exists`),
    );
  });
});
