import { ApiVersionsDto, DataTypeDef, KeyTypes, ReferenceTypes } from "@open-dpp/dto";
import { Property } from "../../domain/submodel-base/property";
import { Security } from "../../domain/security/security";
import { allPermissionsAllowFactory, memberFactory } from "../../../fixtures/security-fixtures";
import { Submodel } from "../../domain/submodel-base/submodel";
import { ValueResponse } from "./value.response";
import { IdShortPath } from "../../domain/common/id-short-path";

describe("ValueResponse", () => {
  const property = Property.create({
    idShort: "link",
    valueType: DataTypeDef.AnyUri,
    value: "https://example.com",
  });
  const submodel = Submodel.create({ idShort: "submodel" });
  const security = Security.create({});
  const member = memberFactory.build();
  security.addPolicy(member, submodel.getIdShortPath(), allPermissionsAllowFactory.build());
  const ability = security.defineAbilityForSubject(member);
  submodel.addSubmodelElement(property, { ability });

  describe("v1 migration", () => {
    it("converts AnyUri Property to ReferenceElement with ExternalReference", () => {
      const response = ValueResponse.create({
        submodel,
        version: ApiVersionsDto.v1,
        ability,
      });

      const result = response.toJSON();
      expect(result).toEqual({
        link: {
          type: ReferenceTypes.ExternalReference,
          keys: [{ type: KeyTypes.GlobalReference, value: "https://example.com" }],
        },
      });
    });

    it("converts AnyUri Property with idShortPath link to ReferenceElement with ExternalReference", () => {
      const response = ValueResponse.create({
        submodel,
        idShortPath: IdShortPath.create({ path: "link" }),
        version: ApiVersionsDto.v1,
        ability,
      });

      const result = response.toJSON();
      expect(result).toEqual({
        type: ReferenceTypes.ExternalReference,
        keys: [{ type: KeyTypes.GlobalReference, value: "https://example.com" }],
      });
    });
  });

  describe("v2 (no migration)", () => {
    it("keeps AnyUri Property as Property", () => {
      const response = ValueResponse.create({
        submodel,
        version: ApiVersionsDto.v2,
        ability,
      });

      const result = response.toJSON();
      expect(result).toEqual({ link: property.value });
    });

    it("keeps AnyUri Property with IdShortPath link as Property", () => {
      const response = ValueResponse.create({
        submodel,
        idShortPath: IdShortPath.create({ path: "link" }),
        version: ApiVersionsDto.v2,
        ability,
      });

      const result = response.toJSON();
      expect(result).toEqual(property.value);
    });
  });
});
