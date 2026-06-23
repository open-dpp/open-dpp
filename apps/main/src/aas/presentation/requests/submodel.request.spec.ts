import { ApiVersionsDto, DataTypeDef, KeyTypes, ReferenceTypes } from "@open-dpp/dto";
import { SubmodelRequest } from "./submodel.request";
import { randomUUID } from "node:crypto";
import { beforeAll } from "@jest/globals";
import { registerSubmodelElementClasses } from "../../domain/submodel-base/register-submodel-element-classes";

describe("SubmodelRequest", () => {
  beforeAll(() => {
    registerSubmodelElementClasses();
  });
  const refElement = {
    modelType: KeyTypes.ReferenceElement,
    idShort: "link",
    value: {
      type: ReferenceTypes.ExternalReference,
      keys: [
        {
          type: KeyTypes.GlobalReference,
          value: "https://example.com",
        },
      ],
    },
  };

  const propElement = {
    modelType: KeyTypes.Property,
    idShort: "link",
    value: "https://example.com",
    valueType: DataTypeDef.AnyUri,
  };

  describe("v1 migration", () => {
    it("converts ReferenceElement to AnyUri Property", () => {
      const request = SubmodelRequest.create({
        body: { id: randomUUID(), idShort: "testSubmodel", submodelElements: [refElement] },
        version: ApiVersionsDto.v1,
      });

      const result = request.toDomain();
      const prop = result.submodelElements[0].toPlain();
      expect(prop.modelType).toBe(KeyTypes.Property);
      expect(prop.value).toEqual("https://example.com");
    });
  });

  describe("v2 (no migration)", () => {
    it("keeps AnyUri Property as Property", () => {
      const request = SubmodelRequest.create({
        body: { id: randomUUID(), idShort: "testSubmodel", submodelElements: [propElement] },
        version: ApiVersionsDto.v2,
      });

      const result = request.toDomain();
      const prop = result.submodelElements[0].toPlain();
      expect(prop.modelType).toBe(KeyTypes.Property);
      expect(prop.value).toEqual("https://example.com");
    });
  });
});
