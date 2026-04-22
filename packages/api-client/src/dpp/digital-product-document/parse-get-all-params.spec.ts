import { DigitalProductDocumentStatusDto, GetAllParamsDto } from "@open-dpp/dto";
import { parseGetAllParams } from "./parse-get-all-params";

describe("parseGetAllParams", () => {
  it("should return an object with name and value properties for each parameter", () => {
    const params: GetAllParamsDto = {
      pagination: { limit: 10, cursor: "cursor" },
      populate: ["environment.assetAdministrationsShells"],
      filter: {
        status: [DigitalProductDocumentStatusDto.Archived],
      },
    };

    const result = parseGetAllParams(params);
    expect(result).toEqual({
      limit: 10,
      cursor: "cursor",
      populate: ["environment.assetAdministrationsShells"],
      status: [DigitalProductDocumentStatusDto.Archived],
    });
  });
});
