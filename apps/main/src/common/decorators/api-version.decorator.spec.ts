import { describe, expect } from "@jest/globals";
import { parseApiVersion } from "./api-version.decorator";
import { ApiVersionsDto } from "@open-dpp/dto";

describe("ApiVersion", () => {
  it("should be parsed from path", () => {
    let path = "/api/v2/test";
    expect(parseApiVersion(path)).toEqual(ApiVersionsDto.v2);
    path = "/api/hello/v2/after/test";
    expect(parseApiVersion(path)).toEqual(ApiVersionsDto.v2);
  });

  it("should fallback to v1", () => {
    const path = "/api/test";
    expect(parseApiVersion(path)).toEqual(ApiVersionsDto.v1);
  });
});
