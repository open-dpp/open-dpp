import { ApiVersions } from "../../../api-version";
import { DataTypeDef, KeyTypes, ReferenceTypes } from "@open-dpp/dto";
import { Property } from "../../domain/submodel-base/property";
import { Security } from "../../domain/security/security";
import { allPermissionsAllowFactory, memberFactory } from "../../../fixtures/security-fixtures";
import { Submodel } from "../../domain/submodel-base/submodel";
import { SubmodelPaginationResponse } from "./submodel-pagination.response";
import { PagingResult } from "../../../pagination/paging-result";
import { Pagination } from "../../../pagination/pagination";

describe("SubmodelPaginationResponse", () => {
  const property = Property.create({
    idShort: "link",
    valueType: DataTypeDef.AnyUri,
    value: "https://example.com",
  });
  const submodel1 = Submodel.create({ idShort: "submodel1" });
  const submodel2 = Submodel.create({ idShort: "submodel2" });
  const security = Security.create({});
  const member = memberFactory.build();
  security.addPolicy(member, submodel1.getIdShortPath(), allPermissionsAllowFactory.build());
  security.addPolicy(member, submodel2.getIdShortPath(), allPermissionsAllowFactory.build());
  const ability = security.defineAbilityForSubject(member);
  submodel1.addSubmodelElement(property, { ability });

  const pagingResult = PagingResult.create({
    items: [submodel1, submodel2],
    pagination: Pagination.create({}),
  });

  describe("v1 migration", () => {
    it("converts AnyUri Property to ReferenceElement with ExternalReference", () => {
      const response = SubmodelPaginationResponse.create({
        pagingResult,
        version: ApiVersions.v1,
        ability,
      });

      const result = response.toJSON();
      const sm = result.result[0];
      const prop = sm.submodelElements[0];
      expect(prop.modelType).toBe(KeyTypes.ReferenceElement);
      expect(prop.value).toEqual({
        type: ReferenceTypes.ExternalReference,
        keys: [{ type: KeyTypes.GlobalReference, value: "https://example.com" }],
      });
    });
  });

  describe("v2 (no migration)", () => {
    it("keeps AnyUri Property as Property", () => {
      const response = SubmodelPaginationResponse.create({
        pagingResult,
        version: ApiVersions.v2,
        ability,
      });

      const result = response.toJSON();
      const sm = result.result[0];
      const prop = sm.submodelElements[0];
      expect(prop).toEqual(property.toPlain());
    });
  });
});
