import { ApiVersionsDto, DataTypeDef, KeyTypes, ReferenceTypes } from "@open-dpp/dto";
import { SubmodelElementResponse } from "./submodel-element.response";
import { Property } from "../../domain/submodel-base/property";
import { Security } from "../../domain/security/security";
import { allPermissionsAllowFactory, memberFactory } from "../../../fixtures/security-fixtures";
import { IdShortPath } from "../../domain/common/id-short-path";

describe("SubmodelElementResponse", () => {
  const property = Property.create({
    idShort: "link",
    valueType: DataTypeDef.AnyUri,
    value: "https://example.com",
  });
  const security = Security.create({});
  const member = memberFactory.build();
  security.addPolicy(
    member,
    IdShortPath.create({ path: "link" }),
    allPermissionsAllowFactory.build(),
  );
  const ability = security.defineAbilityForSubject(member);

  describe("v1 migration", () => {
    it("converts AnyUri Property to ReferenceElement with ExternalReference", () => {
      const response = SubmodelElementResponse.create({
        submodelElement: property,
        version: ApiVersionsDto.v1,
        ability,
      });

      const result = response.toJSON();

      expect(result.modelType).toBe(KeyTypes.ReferenceElement);
      expect(result.value).toEqual({
        type: ReferenceTypes.ExternalReference,
        keys: [{ type: KeyTypes.GlobalReference, value: "https://example.com" }],
      });
    });
  });

  describe("v2 (no migration)", () => {
    it("keeps AnyUri Property as Property", () => {
      const response = SubmodelElementResponse.create({
        submodelElement: property,
        version: ApiVersionsDto.v2,
        ability,
      });

      const result = response.toJSON();

      expect(result).toEqual(property.toPlain());
    });
  });
});
