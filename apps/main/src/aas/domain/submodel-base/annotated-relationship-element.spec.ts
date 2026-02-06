import { expect } from "@jest/globals";
import { DataTypeDef, ReferenceTypes } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { Reference } from "../common/reference";
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
    expect(annotatedRelationshipElement.getSubmodelElements()).toEqual([submodelElement]);
    expect(() => annotatedRelationshipElement.addSubmodelElement(submodelElement)).toThrow(new ValueError(
      "Submodel element with idShort prop1 already exists",
    ));
  });

  it("should delete submodel element", () => {
    const annotatedRelationshipElement = AnnotatedRelationshipElement.create({
      idShort: "idShort",
      first: Reference.create({ type: ReferenceTypes.ExternalReference, keys: [] }),
      second: Reference.create({ type: ReferenceTypes.ExternalReference, keys: [] }),
    });
    const submodelElement0 = Property.create({ idShort: "prop1", valueType: DataTypeDef.String });
    annotatedRelationshipElement.addSubmodelElement(submodelElement0);
    const submodelElement1 = Property.create({ idShort: "prop2", valueType: DataTypeDef.String });
    annotatedRelationshipElement.addSubmodelElement(submodelElement1);
    expect(annotatedRelationshipElement.getSubmodelElements()).toEqual([submodelElement0, submodelElement1]);
    annotatedRelationshipElement.deleteSubmodelElement(submodelElement0.idShort);
    expect(annotatedRelationshipElement.getSubmodelElements()).toEqual([submodelElement1]);
    expect(() => annotatedRelationshipElement.deleteSubmodelElement("unknown")).toThrow(ValueError);
  });
});
