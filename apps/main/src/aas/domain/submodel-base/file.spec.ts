import { expect } from "@jest/globals";
import { ValueError } from "@open-dpp/exception";
import { propertyPlainFactory } from "@open-dpp/testing";
import { File } from "./file";
import { Property } from "./property";

describe("file", () => {
  it("should add submodel element", () => {
    const file = File.create({ idShort: "b1", contentType: "image/jpg" });
    expect(() => file.addSubmodelElement(Property.fromPlain(propertyPlainFactory.build()))).toThrow(
      new ValueError("File cannot contain submodel elements"),
    );
  });

  it("should get submodel elements", () => {
    const file = File.create({ idShort: "b1", contentType: "image/jpg" });
    expect(file.getSubmodelElements()).toEqual([]);
  });
});
