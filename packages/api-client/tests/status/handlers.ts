import { http, HttpResponse } from "msw";
import { LatestApiVersionDto } from "@open-dpp/dto";

const baseURL = `https://cloud.open-dpp.de/api/v${LatestApiVersionDto}`;

export const statusResponse = { version: "0.1.0" };

export const statusHandlers = [
  http.get(`${baseURL}/status`, () => {
    return HttpResponse.json(statusResponse);
  }),
];
