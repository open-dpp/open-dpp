import { expect } from "@jest/globals";
import { AasSubmodelElements } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
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
    const submodelElement = Property.fromPlain(propertyPlainFactory.build({ idShort: "submodelElement1" }));
    submodelElementList.addSubmodelElement(submodelElement);
    expect(submodelElementList.getSubmodelElements()).toEqual([submodelElement]);

    const submodelElement0 = Property.fromPlain(propertyPlainFactory.build({ idShort: "submodelElement0" }));
    submodelElementList.addSubmodelElement(submodelElement0, { position: 0 });
    expect(submodelElementList.getSubmodelElements()).toEqual([submodelElement0, submodelElement]);

    expect(() => submodelElementList.addSubmodelElement(submodelElement)).toThrow(
      new Error(`Submodel element with idShort ${submodelElement.idShort} already exists`),
    );
    expect(() => submodelElementList.addSubmodelElement(SubmodelElementCollection.create({ idShort: "sec1" }))).toThrow(
      new Error(`Submodel element type SubmodelElementCollection does not match list type Property`),
    );
  });

  it("should delete submodel element", () => {
    const submodelElementList = SubmodelElementList.create({
      typeValueListElement: AasSubmodelElements.Property,
      idShort: "idShort",
    });
    const submodelElement0 = Property.fromPlain(propertyPlainFactory.build({ idShort: "submodelElement0" }));
    submodelElementList.addSubmodelElement(submodelElement0);
    const submodelElement1 = Property.fromPlain(propertyPlainFactory.build({ idShort: "submodelElement1" }));
    submodelElementList.addSubmodelElement(submodelElement1);
    expect(submodelElementList.getSubmodelElements()).toEqual([submodelElement0, submodelElement1]);
    submodelElementList.deleteSubmodelElement(submodelElement0.idShort);
    expect(submodelElementList.getSubmodelElements()).toEqual([submodelElement1]);

    expect(() => submodelElementList.deleteSubmodelElement("unknown")).toThrow(ValueError);
  });
});
