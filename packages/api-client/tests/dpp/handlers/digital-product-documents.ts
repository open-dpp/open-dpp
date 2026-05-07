import { baseURL } from "./index";
import { http, HttpResponse } from "msw";
import { checkQueryParameters } from "../../utils";
import { paginationParams } from "./aas";
import { randomUUID } from "node:crypto";
import { activitiesPlainFactory } from "@open-dpp/testing";

export const digitalProductDocumentId = randomUUID();

export const activity1 = activitiesPlainFactory.build();
export const activity2 = activitiesPlainFactory.build();

export const periodParams = {
  startDate: "2022-01-01T00:00:00.000Z",
  endDate: "2022-01-08T00:00:00.000Z",
};
export function digitalProductDocumentHandlers(basePath: string) {
  const endpointUrl = `${baseURL}/${basePath}`;

  return [
    http.get(`${endpointUrl}/${digitalProductDocumentId}/activities`, async ({ request }) => {
      const errorResponse = checkQueryParameters(request, {
        limit: paginationParams.limit.toFixed(),
      });

      return (
        errorResponse ||
        HttpResponse.json(
          {
            paging_metadata: {
              cursor: activity2.header.id,
            },
            result: [activity1, activity2],
          },
          {
            status: 200,
          },
        )
      );
    }),
    http.get(
      `${endpointUrl}/${digitalProductDocumentId}/activities/download`,
      async ({ request }) => {
        const errorResponse = checkQueryParameters(request, {
          startDate: periodParams.startDate,
          endDate: periodParams.endDate,
        });

        return (
          errorResponse ||
          HttpResponse.arrayBuffer(new ArrayBuffer(0), {
            status: 200,
            headers: {
              "Content-Type": "application/zip",
              "Content-Disposition": 'attachment; filename="data.zip"',
            },
          })
        );
      },
    ),
  ];
}
