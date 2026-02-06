import { expect } from "@jest/globals";
import { EntityType } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { propertyPlainFactory } from "@open-dpp/testing";
import { Entity } from "./entity";
import { Property } from "./property";

describe("entity", () => {
  it("should add submodel element", () => {
    const entity = Entity.create({
      idShort: "idShort",
      entityType: EntityType.CoManagedEntity,
    });
    const submodelElement = Property.fromPlain(propertyPlainFactory.build());
    entity.addSubmodelElement(submodelElement);
    expect(entity.getSubmodelElements()).toEqual([submodelElement]);
    expect(() => entity.addSubmodelElement(submodelElement)).toThrow(new ValueError(
      `Submodel element with idShort ${submodelElement.idShort} already exists`,
    ));
  });
});
