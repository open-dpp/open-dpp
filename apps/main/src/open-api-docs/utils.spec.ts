import { convertPathToOpenApi } from "./utils";

it("should convert to open api path", () => {
  expect(convertPathToOpenApi("passports/:id/submodels/:submodelId/submodelElements")).toEqual(
    "passports/{id}/submodels/{submodelId}/submodelElements",
  );
});
