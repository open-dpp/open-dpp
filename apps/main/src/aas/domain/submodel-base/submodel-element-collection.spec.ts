import { expect } from "@jest/globals";
import { ValueError } from "@open-dpp/exception";
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
    expect(submodelElementCollection.getSubmodelElements()).toEqual([submodelElement]);

    const submodelElement0 = Property.fromPlain(propertyPlainFactory.build({ idShort: "submodelElement0" }));
    submodelElementCollection.addSubmodelElement(submodelElement0, { position: 0 });
    expect(submodelElementCollection.getSubmodelElements()).toEqual([submodelElement0, submodelElement]);

    expect(() => submodelElementCollection.addSubmodelElement(submodelElement)).toThrow(
      new Error(`Submodel element with idShort ${submodelElement.idShort} already exists`),
    );
  });

  it("should delete submodel element", () => {
    const submodelElementCollection = SubmodelElementCollection.create({
      idShort: "idShort",
    });
    const submodelElement1 = Property.fromPlain(propertyPlainFactory.build({ idShort: "submodelElement1" }));
    submodelElementCollection.addSubmodelElement(submodelElement1);
    const submodelElement2 = Property.fromPlain(propertyPlainFactory.build({ idShort: "submodelElement2" }));
    submodelElementCollection.addSubmodelElement(submodelElement2);

    expect(submodelElementCollection.getSubmodelElements()).toEqual([submodelElement1, submodelElement2]);
    submodelElementCollection.deleteSubmodelElement(submodelElement1.idShort);
    expect(submodelElementCollection.getSubmodelElements()).toEqual([submodelElement2]);

    expect(() => submodelElementCollection.deleteSubmodelElement("unknown idShort")).toThrow(
      ValueError,
    );
  });
});
