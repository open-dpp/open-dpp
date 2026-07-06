import {
  ApiVersionsDto,
  DataTypeDef,
  KeyTypes,
  ReferenceTypes,
  SubmodelElementSchema,
} from "@open-dpp/dto";
import { SubmodelElementRequest } from "./submodel-element.request";
import { beforeAll } from "@jest/globals";
import { registerSubmodelElementClasses } from "../../domain/submodel-base/register-submodel-element-classes";

describe("SubmodelElementRequest", () => {
  beforeAll(() => {
    registerSubmodelElementClasses();
  });

  const refElement = SubmodelElementSchema.parse({
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
  });

  const propElement = SubmodelElementSchema.parse({
    modelType: KeyTypes.Property,
    idShort: "link",
    value: "https://example.com",
    valueType: DataTypeDef.AnyUri,
  });

  describe("v1 migration", () => {
    it("converts ReferenceElement to AnyUri Property", () => {
      const request = SubmodelElementRequest.create({
        body: refElement,
        version: ApiVersionsDto.v1,
      });

      const result = request.toDomain();
      const prop = result.toPlain();
      expect(prop.modelType).toBe(KeyTypes.Property);
      expect(prop.value).toEqual("https://example.com");
      expect(prop.valueType).toEqual(DataTypeDef.AnyUri);
    });
  });

  describe("v2 (no migration)", () => {
    it("keeps AnyUri Property as Property", () => {
      const request = SubmodelElementRequest.create({
        body: propElement,
        version: ApiVersionsDto.v2,
      });

      const result = request.toDomain();
      const prop = result.toPlain();
      expect(prop.modelType).toBe(KeyTypes.Property);
      expect(prop.value).toEqual("https://example.com");
      expect(prop.valueType).toEqual(DataTypeDef.AnyUri);
    });
  });
});
