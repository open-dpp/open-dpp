import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";
import { isBadRequestError } from "./api-error-mapping";

function apiError(status: number): AxiosError {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError(`Request failed with status code ${status}`, undefined, config, null, {
    status,
    statusText: "",
    data: {},
    headers: {},
    config,
  });
}

describe("isBadRequestError", () => {
  it("is true for a response with status 400", () => {
    expect(isBadRequestError(apiError(400))).toBe(true);
  });

  it.each([401, 413, 429, 500])("is false for a response with status %i", (status) => {
    expect(isBadRequestError(apiError(status))).toBe(false);
  });

  it("is false when the request got no response", () => {
    expect(isBadRequestError(new AxiosError("Network Error"))).toBe(false);
  });

  it("is false for an error that is not an API error", () => {
    expect(isBadRequestError(new Error("boom"))).toBe(false);
    expect(isBadRequestError({ response: { status: 400 } })).toBe(false);
  });
});
