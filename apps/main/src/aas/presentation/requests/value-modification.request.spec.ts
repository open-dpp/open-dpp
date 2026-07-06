import { ApiVersionsDto, KeyTypes, ReferenceTypes } from "@open-dpp/dto";
import { beforeAll } from "@jest/globals";
import { registerSubmodelElementClasses } from "../../domain/submodel-base/register-submodel-element-classes";
import { ValueModificationRequest } from "./value-modification.request";

describe("ValueModificationRequest", () => {
  beforeAll(() => {
    registerSubmodelElementClasses();
  });

  const body = {
    link: {
      type: ReferenceTypes.ExternalReference,
      keys: [
        {
          type: KeyTypes.GlobalReference,
          value: "https://example.com",
        },
      ],
    },
  };

  const body2 = {
    link: "https://example.com",
  };

  describe("v1 migration", () => {
    it("converts ReferenceElement to AnyUri Property", () => {
      const request = ValueModificationRequest.create({
        body,
        version: ApiVersionsDto.v1,
      });

      const result: any = request.toDomain();
      expect(result.link).toEqual("https://example.com");
    });
  });

  describe("v2 (no migration)", () => {
    it("keeps AnyUri Property as Property", () => {
      const request = ValueModificationRequest.create({
        body: body2,
        version: ApiVersionsDto.v2,
      });

      const result: any = request.toDomain();
      expect(result.link).toEqual("https://example.com");
    });
  });
});
