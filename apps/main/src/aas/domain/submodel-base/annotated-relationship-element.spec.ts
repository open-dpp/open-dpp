import { expect } from "@jest/globals";
import { ValueError } from "@open-dpp/exception";
import { DataTypeDef } from "../common/data-type-def";
import { Reference, ReferenceTypes } from "../common/reference";
import { AnnotatedRelationshipElement } from "./annotated-relationship-element";
import { Property } from "./property";

describe("annotatedRelationshipElement", () => {
  it("should add submodel element", () => {
    const annotatedRelationshipElement = AnnotatedRelationshipElement.create({
      idShort: "idShort",
      first: Reference.create({ type: ReferenceTypes.ExternalReference, keys: [] }),
      second: Reference.create({ type: ReferenceTypes.ExternalReference, keys: [] }),
    });
    const submodelElement = Property.create({ idShort: "prop1", valueType: DataTypeDef.String });
    annotatedRelationshipElement.addSubmodelElement(submodelElement);
    expect([...annotatedRelationshipElement.getSubmodelElements()]).toEqual([submodelElement]);
    expect(() => annotatedRelationshipElement.addSubmodelElement(submodelElement)).toThrow(new ValueError(
      "Submodel element with idShort prop1 already exists",
    ));
  });
});
