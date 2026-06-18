import { http, HttpResponse } from "msw";
import { LatestApiVersionWithPrefixDto } from "@open-dpp/dto";

const baseURL = `https://cloud.open-dpp.de/api/${LatestApiVersionWithPrefixDto}`;

export const statusResponse = { version: "0.1.0" };

export const statusHandlers = [
  http.get(`${baseURL}/status`, () => {
    return HttpResponse.json(statusResponse);
  }),
];
