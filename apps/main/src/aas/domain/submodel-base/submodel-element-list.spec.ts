import { expect } from "@jest/globals";
import { AasSubmodelElements } from "@open-dpp/dto";
import { propertyPlainFactory } from "@open-dpp/testing";
import { Property } from "./property";
import { registerSubmodelElementClasses } from "./register-submodel-element-classes";
import { SubmodelElementCollection } from "./submodel-element-collection";
import { SubmodelElementList } from "./submodel-element-list";

describe("submodelElementList", () => {
  beforeAll(() => {
    registerSubmodelElementClasses();
  });
  it("should add submodel element", () => {
    const submodelElementList = SubmodelElementList.create({
      typeValueListElement: AasSubmodelElements.Property,
      idShort: "idShort",
    });
    const submodelElement = Property.fromPlain(propertyPlainFactory.build());
    submodelElementList.addSubmodelElement(submodelElement);
    expect([...submodelElementList.getSubmodelElements()]).toEqual([submodelElement]);
    expect(() => submodelElementList.addSubmodelElement(submodelElement)).toThrow(
      new Error(`Submodel element with idShort ${submodelElement.idShort} already exists`),
    );
    expect(() => submodelElementList.addSubmodelElement(SubmodelElementCollection.create({ idShort: "sec1" }))).toThrow(
      new Error(`Submodel element type SubmodelElementCollection does not match list type Property`),
    );
  });
});
