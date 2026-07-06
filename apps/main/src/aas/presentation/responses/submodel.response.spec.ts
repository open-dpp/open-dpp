import { ApiVersionsDto, DataTypeDef, KeyTypes, ReferenceTypes } from "@open-dpp/dto";
import { Property } from "../../domain/submodel-base/property";
import { Security } from "../../domain/security/security";
import { allPermissionsAllowFactory, memberFactory } from "../../../fixtures/security-fixtures";
import { Submodel } from "../../domain/submodel-base/submodel";
import { SubmodelResponse } from "./submodel.response";

describe("SubmodelElement", () => {
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
      const response = SubmodelResponse.create({
        submodel,
        version: ApiVersionsDto.v1,
        ability,
      });

      const result = response.toJSON();
      const prop = result.submodelElements[0];
      expect(prop.modelType).toBe(KeyTypes.ReferenceElement);
      expect(prop.value).toEqual({
        type: ReferenceTypes.ExternalReference,
        keys: [{ type: KeyTypes.GlobalReference, value: "https://example.com" }],
      });
    });
  });

  describe("v2 (no migration)", () => {
    it("keeps AnyUri Property as Property", () => {
      const response = SubmodelResponse.create({
        submodel,
        version: ApiVersionsDto.v2,
        ability,
      });

      const result = response.toJSON();
      const prop = result.submodelElements[0];
      expect(prop).toEqual(property.toPlain());
    });
  });
});
