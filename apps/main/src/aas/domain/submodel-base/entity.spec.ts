import { expect } from "@jest/globals";
import { ValueError } from "@open-dpp/exception";
import { propertyPlainFactory } from "../../fixtures/submodel-element.factory";
import { Entity, EntityType } from "./entity";
import { Property } from "./property";

describe("entity", () => {
  it("should add submodel element", () => {
    const entity = Entity.create({
      idShort: "idShort",
      entityType: EntityType.CoManagedEntity,
    });
    const submodelElement = Property.fromPlain(propertyPlainFactory.build());
    entity.addSubmodelElement(submodelElement);
    expect([...entity.getSubmodelElements()]).toEqual([submodelElement]);
    expect(() => entity.addSubmodelElement(submodelElement)).toThrow(new ValueError(
      `Submodel element with idShort ${submodelElement.idShort} already exists`,
    ));
  });
});
