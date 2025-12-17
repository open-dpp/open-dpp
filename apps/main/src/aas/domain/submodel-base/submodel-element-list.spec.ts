import { expect } from "@jest/globals";
import { propertyPlainFactory } from "../../fixtures/submodel-element.factory";
import { AasSubmodelElements } from "./aas-submodel-elements";
import { Property } from "./property";
import { SubmodelElementCollection } from "./submodel-element-collection";
import { SubmodelElementList } from "./submodel-element-list";

describe("submodelElementList", () => {
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
