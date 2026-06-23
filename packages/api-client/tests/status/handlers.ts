import { http, HttpResponse } from "msw";
import { LatestApiVersionWithPrefixDto } from "@open-dpp/dto";
import { DEFAULT_API_URL } from "../../src/urls";

const baseURL = `${DEFAULT_API_URL}/${LatestApiVersionWithPrefixDto}`;

export const statusResponse = { version: "0.1.0" };

export const statusHandlers = [
  http.get(`${baseURL}/status`, () => {
    return HttpResponse.json(statusResponse);
  }),
];
