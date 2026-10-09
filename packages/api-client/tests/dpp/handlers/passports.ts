import { passportsPlainFactory } from "@open-dpp/testing";
import { http, HttpResponse } from "msw";
import { activeOrganization } from "./organization";
import { checkQueryParameters } from "../../utils";
import { baseURL } from "./index";
import { DigitalProductDocumentStatusDto, PassportEditingModeDto } from "@open-dpp/dto";
import { filterParams } from "./aas";
import { paginationParams } from "./pagination";

export const passport1 = passportsPlainFactory.build({ organizationId: activeOrganization.id });
export const passport2 = passportsPlainFactory.build({ organizationId: activeOrganization.id });

export const passportFilterParams = {
  templateIds: ["template-1", "template-2"],
  startDate: "2022-01-01T00:00:00.000Z",
  endDate: "2022-02-01T00:00:00.000Z",
};

export function passportsHandlers() {
  const passportsEndpointUrl = `${baseURL}/passports`;

  return [
    http.post(`${passportsEndpointUrl}`, async () => {
      return HttpResponse.json(passport1, { status: 201 });
    }),
    http.get(`${passportsEndpointUrl}`, async ({ request }) => {
      const url = new URL(request.url);
      const withPassportFilters = url.searchParams.has("templateId");
      const errorResponse = checkQueryParameters(request, {
        limit: paginationParams.limit.toFixed(),
        status: filterParams.status[0],
        ...(withPassportFilters && {
          // checkQueryParameters compares the first value, repeated params are checked below
          templateId: passportFilterParams.templateIds[0],
          startDate: passportFilterParams.startDate,
          endDate: passportFilterParams.endDate,
        }),
      });
      if (
        !errorResponse &&
        withPassportFilters &&
        JSON.stringify(url.searchParams.getAll("templateId")) !==
          JSON.stringify(passportFilterParams.templateIds)
      ) {
        return HttpResponse.json(
          { message: "templateId must be sent as repeated param" },
          { status: 500 },
        );
      }

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
    http.post(`${passportsEndpointUrl}/export-to-registry`, async ({ request }) => {
      const body = await request.json();
      if (JSON.stringify(body) !== JSON.stringify(passportFilterParams)) {
        return HttpResponse.json({ message: "unexpected body" }, { status: 400 });
      }
      return HttpResponse.arrayBuffer(new ArrayBuffer(0), {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": 'attachment; filename="eu-registry-export.zip"',
        },
      });
    }),
    http.delete(`${passportsEndpointUrl}/${passport1.id}`, async () => {
      return HttpResponse.json(undefined, { status: 204 });
    }),
    http.put(`${passportsEndpointUrl}/${passport1.id}/status`, async () => {
      return HttpResponse.json(
        {
          ...passport1,
          lastStatusChange: {
            ...passport1.lastStatusChange,
            currentStatus: DigitalProductDocumentStatusDto.Published,
          },
        },
        { status: 200 },
      );
    }),
    http.put(`${passportsEndpointUrl}/${passport1.id}/editing-mode`, async () => {
      return HttpResponse.json(
        {
          ...passport1,
          editingMode: PassportEditingModeDto.Full,
        },
        { status: 200 },
      );
    }),
  ];
}
