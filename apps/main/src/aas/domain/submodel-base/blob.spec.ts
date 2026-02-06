import { expect } from "@jest/globals";
import { ValueError } from "@open-dpp/exception";
import { propertyPlainFactory } from "@open-dpp/testing";
import { Blob } from "./blob";
import { Property } from "./property";

describe("blob", () => {
  it("should add submodel element", () => {
    const blob = Blob.create({ idShort: "b1", contentType: "image/jpg" });
    expect(() => blob.addSubmodelElement(Property.fromPlain(propertyPlainFactory.build()))).toThrow(
      new ValueError("Blob cannot contain submodel elements"),
    );
  });

  it("should get submodel elements", () => {
    const blob = Blob.create({ idShort: "b1", contentType: "image/jpg" });
    expect(blob.getSubmodelElements()).toEqual([]);
  });
});
