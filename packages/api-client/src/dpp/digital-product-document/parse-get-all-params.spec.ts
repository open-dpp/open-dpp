import {
  DigitalProductDocumentStatusDto,
  GetAllParamsDto,
  GetAllPassportsParamsDto,
} from "@open-dpp/dto";
import { parseGetAllParams, parseGetAllPassportsParams } from "./parse-get-all-params";

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

describe("parseGetAllParams period filter", () => {
  it("passes startDate and endDate through as query params", () => {
    const params: GetAllParamsDto = {
      filter: {
        status: [DigitalProductDocumentStatusDto.Draft],
        startDate: "2022-01-01T00:00:00.000Z",
        endDate: "2022-02-01T00:00:00.000Z",
      },
    };

    expect(parseGetAllParams(params)).toEqual({
      status: [DigitalProductDocumentStatusDto.Draft],
      startDate: "2022-01-01T00:00:00.000Z",
      endDate: "2022-02-01T00:00:00.000Z",
    });
  });
});

describe("parseGetAllPassportsParams", () => {
  it("maps templateIds to the templateId query param and keeps the other filters", () => {
    const params: GetAllPassportsParamsDto = {
      pagination: { limit: 10, cursor: "cursor" },
      populate: ["environment.assetAdministrationsShells"],
      filter: {
        status: [DigitalProductDocumentStatusDto.Published],
        templateIds: ["t1", "t2"],
        startDate: "2022-01-01T00:00:00.000Z",
        endDate: "2022-02-01T00:00:00.000Z",
      },
    };

    expect(parseGetAllPassportsParams(params)).toEqual({
      limit: 10,
      cursor: "cursor",
      populate: ["environment.assetAdministrationsShells"],
      status: [DigitalProductDocumentStatusDto.Published],
      templateId: ["t1", "t2"],
      startDate: "2022-01-01T00:00:00.000Z",
      endDate: "2022-02-01T00:00:00.000Z",
    });
  });

  it("omits the filter keys that are not set", () => {
    expect(parseGetAllPassportsParams({ pagination: { limit: 5 } })).toEqual({ limit: 5 });
  });
});
