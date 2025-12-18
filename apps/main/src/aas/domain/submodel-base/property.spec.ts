import { expect } from "@jest/globals";
import { DataTypeDef } from "@open-dpp/aas";
import { ValueError } from "@open-dpp/exception";
import { propertyPlainFactory } from "../../fixtures/submodel-element.factory";
import { Property } from "./property";

describe("property", () => {
  it("should add submodel element", () => {
    const property = Property.create({ idShort: "b1", valueType: DataTypeDef.String });
    expect(() => property.addSubmodelElement(Property.fromPlain(propertyPlainFactory.build()))).toThrow(
      new ValueError("Property cannot contain submodel elements"),
    );
  });

  it("should get submodel elements", () => {
    const property = Property.create({ idShort: "b1", valueType: DataTypeDef.String });
    expect([...property.getSubmodelElements()]).toEqual([]);
  });
});
