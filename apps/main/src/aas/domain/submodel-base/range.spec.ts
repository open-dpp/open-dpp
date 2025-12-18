import { expect } from "@jest/globals";
import { DataTypeDef } from "@open-dpp/aas";
import { ValueError } from "@open-dpp/exception";
import { propertyPlainFactory } from "../../fixtures/submodel-element.factory";
import { Property } from "./property";
import { Range } from "./range";

describe("range", () => {
  it("should add submodel element", () => {
    const range = Range.create({ idShort: "b1", valueType: DataTypeDef.String });
    expect(() => range.addSubmodelElement(Property.fromPlain(propertyPlainFactory.build()))).toThrow(
      new ValueError("Range cannot contain submodel elements"),
    );
  });

  it("should get submodel elements", () => {
    const range = Range.create({ idShort: "b1", valueType: DataTypeDef.String });
    expect([...range.getSubmodelElements()]).toEqual([]);
  });
});
