import { randomUUID } from "node:crypto";
import { http, HttpResponse } from "msw";
import { activeOrganization } from "./organization";
import { baseURL } from "./index";
import { checkQueryParameters } from "../../utils";

import { paginationParams } from "./pagination";

export const bulkImportConfig1 = {
  id: randomUUID(),
  organizationId: activeOrganization.id,
  templateId: randomUUID(),
  name: "ERP export",
  idField: "sku",
  submodelMappings: [
    { submodelIdShort: randomUUID(), fieldMappings: [{ input: "sku", output: "sku" }] },
  ],
  inputSample: { sku: "4711" },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
export const bulkImportConfig2 = {
  ...bulkImportConfig1,
  id: randomUUID(),
  name: "Second export",
};

export const bulkImportRun1 = {
  id: randomUUID(),
  bulkImportConfigId: bulkImportConfig1.id,
  organizationId: activeOrganization.id,
  status: "pending",
  userId: randomUUID(),
  totalCount: 2,
  succeededCount: 0,
  failedCount: 0,
  startedAt: null,
  finishedAt: null,
  createdAt: new Date().toISOString(),
};

export const bulkImportRunItem1 = {
  id: randomUUID(),
  runId: bulkImportRun1.id,
  rowIndex: 0,
  inputData: { sku: "4711" },
  status: "created",
  passportId: randomUUID(),
  error: null,
};

export const bulkImportParseResult = {
  rows: [{ sku: "4711" }, { sku: "4712" }],
};

export function bulkImportHandlers() {
  const configEndpoint = `${baseURL}/bulk-import/configs`;
  const runEndpoint = `${baseURL}/bulk-import/runs`;

  return [
    http.post(configEndpoint, async () => {
      return HttpResponse.json(bulkImportConfig1, { status: 201 });
    }),
    http.get(configEndpoint, async () => {
      return HttpResponse.json(
        {
          paging_metadata: { cursor: null },
          result: [bulkImportConfig1, bulkImportConfig2],
        },
        { status: 200 },
      );
    }),
    http.get(`${configEndpoint}/${bulkImportConfig1.id}`, async () => {
      return HttpResponse.json(bulkImportConfig1, { status: 200 });
    }),
    http.put(`${configEndpoint}/${bulkImportConfig1.id}`, async () => {
      return HttpResponse.json({ ...bulkImportConfig1, name: "Renamed export" }, { status: 200 });
    }),
    http.delete(`${configEndpoint}/${bulkImportConfig1.id}`, async () => {
      return HttpResponse.json(undefined, { status: 204 });
    }),
    http.post(`${configEndpoint}/${bulkImportConfig1.id}/runs`, async () => {
      return HttpResponse.json(bulkImportRun1, { status: 201 });
    }),
    http.post(`${configEndpoint}/${bulkImportConfig1.id}/runs/upload`, async () => {
      return HttpResponse.json(bulkImportRun1, { status: 201 });
    }),
    http.post(`${baseURL}/bulk-import/parse-file`, async () => {
      return HttpResponse.json(bulkImportParseResult, { status: 201 });
    }),
    http.get(`${configEndpoint}/${bulkImportConfig1.id}/runs`, async () => {
      return HttpResponse.json(
        { paging_metadata: { cursor: null }, result: [bulkImportRun1] },
        { status: 200 },
      );
    }),
    http.get(`${runEndpoint}/${bulkImportRun1.id}`, async () => {
      return HttpResponse.json(bulkImportRun1, { status: 200 });
    }),
    http.get(`${runEndpoint}/${bulkImportRun1.id}/items`, async ({ request }) => {
      const errorResponse = checkQueryParameters(request, {
        limit: paginationParams.limit.toFixed(),
      });
      // With pagination params, return paginated response
      return (
        errorResponse ||
        HttpResponse.json(
          {
            paging_metadata: { cursor: null },
            result: [bulkImportRunItem1],
          },
          { status: 200 },
        )
      );
    }),
  ];
}
