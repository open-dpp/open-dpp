import { expect } from "@jest/globals";
import { DataTypeDef, ReferenceTypes } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { Reference } from "../common/reference";
import { Property } from "./property";
import { RelationshipElement } from "./relationship-element";

describe("relationshipElement", () => {
  it("should add submodel element", () => {
    const relationshipElement = RelationshipElement.create({
      idShort: "idShort",
      first: Reference.create({ type: ReferenceTypes.ExternalReference, keys: [] }),
      second: Reference.create({ type: ReferenceTypes.ExternalReference, keys: [] }),
    });
    const submodelElement = Property.create({ idShort: "prop1", valueType: DataTypeDef.String });
    expect(() => relationshipElement.addSubmodelElement(submodelElement)).toThrow(new ValueError(
      "RelationshipElement cannot contain submodel elements",
    ));
  });

  it("should get submodel element", () => {
    const relationshipElement = RelationshipElement.create({
      idShort: "idShort",
      first: Reference.create({ type: ReferenceTypes.ExternalReference, keys: [] }),
      second: Reference.create({ type: ReferenceTypes.ExternalReference, keys: [] }),
    });
    expect([...relationshipElement.getSubmodelElements()]).toEqual([]);
  });
});
