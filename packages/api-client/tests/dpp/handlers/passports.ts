import { randomUUID } from "node:crypto";
import { passportsPlainFactory } from "@open-dpp/testing";
import { http, HttpResponse } from "msw";
import { activeOrganization } from "../../organization";
import { checkQueryParameters } from "../../utils";
import { baseURL } from "./index";
import { DppStatusDto } from "@open-dpp/dto";

export const paginationParams = { limit: 10, cursor: randomUUID() };
export const passport1 = passportsPlainFactory.build({ organizationId: activeOrganization.id });
export const passport2 = passportsPlainFactory.build({ organizationId: activeOrganization.id });

export function passportsHandlers() {
  const passportsEndpointUrl = `${baseURL}/passports`;

  return [
    http.post(`${passportsEndpointUrl}`, async () => {
      return HttpResponse.json(passport1, { status: 201 });
    }),
    http.get(`${passportsEndpointUrl}`, async ({ request }) => {
      const errorResponse = checkQueryParameters(request, {
        limit: paginationParams.limit.toFixed(),
      });

      return (
        errorResponse ||
        HttpResponse.json(
          {
            paging_metadata: {
              cursor: passport2.id,
            },
            result: [passport1, passport2],
          },
          {
            status: 200,
          },
        )
      );
    }),
    http.delete(`${passportsEndpointUrl}/${passport1.id}`, async () => {
      return HttpResponse.json(undefined, { status: 204 });
    }),
    http.put(`${passportsEndpointUrl}/${passport1.id}/status`, async () => {
      return HttpResponse.json(
        {
          passport1,
          lastStatusChange: {
            ...passport1.lastStatusChange,
            currentStatus: DppStatusDto.Published,
          },
        },
        { status: 200 },
      );
    }),
  ];
}
