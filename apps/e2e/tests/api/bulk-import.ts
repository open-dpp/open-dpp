// Helper to delete a bulk import config
import { ORGANIZATION_ID_HEADER } from "./organizations";
import { ApiBase } from "../config";
import { expect } from "../fixtures";

export async function deleteBulkImportConfig(request: any, orgaId: string, configId: string) {
  const headers = { [ORGANIZATION_ID_HEADER]: orgaId };
  await request.delete(`${ApiBase}/bulk-import/configs/${configId}`, { headers });
}

export async function createBulkImportConfig(
  request: any,
  orgaId: string,
  templateId: string,
  name: string,
) {
  const configData = {
    templateId,
    name,
    idField: "id",
    inputSample: { sku: "1234567890", batteryCategory: "AAA", batteryId: "bat1" },
    submodelMappings: [
      {
        submodelIdShort: "productData",
        fieldMappings: [{ input: "sku", output: "batteryCategory" }],
      },
    ],
  };
  const headers = { [ORGANIZATION_ID_HEADER]: orgaId };
  const response = await request.post(`${ApiBase}/bulk-import/configs`, {
    data: configData,
    headers,
  });
  expect(response.ok()).toBeTruthy();
  return await response.json();
}

export async function createBulkImportRun(
  request: any,
  orgaId: string,
  configId: string,
  rows: Record<string, unknown>[],
) {
  const headers = { [ORGANIZATION_ID_HEADER]: orgaId };
  const response = await request.post(`${ApiBase}/bulk-import/configs/${configId}/runs`, {
    data: { rows },
    headers,
  });
  expect(response.ok()).toBeTruthy();
  return await response.json();
}
