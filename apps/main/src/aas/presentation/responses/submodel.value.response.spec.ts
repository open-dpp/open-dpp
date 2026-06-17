import { ApiVersions } from "../../../api-version";
import { DataTypeDef, KeyTypes, ReferenceTypes } from "@open-dpp/dto";
import { Property } from "../../domain/submodel-base/property";
import { Security } from "../../domain/security/security";
import { allPermissionsAllowFactory, memberFactory } from "../../../fixtures/security-fixtures";
import { Submodel } from "../../domain/submodel-base/submodel";
import { SubmodelValueResponse } from "./submodel.value.response";

describe("SubmodelValueResponse", () => {
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
      const response = SubmodelValueResponse.create({
        submodel,
        version: ApiVersions.v1,
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
  });

  describe("v2 (no migration)", () => {
    it("keeps AnyUri Property as Property", () => {
      const response = SubmodelValueResponse.create({
        submodel,
        version: ApiVersions.v2,
        ability,
      });

      const result = response.toJSON();
      expect(result).toEqual({ link: property.value });
    });
  });
});
