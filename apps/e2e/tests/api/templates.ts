import { Battery_Passport } from "./battery-passport";
import { expect } from "../fixtures";
import { ApiBase } from "../config";
import { ORGANIZATION_ID_HEADER } from "./organizations";

export async function createBatteryTemplate(request: any, orgaId: string) {
  const templateData = Battery_Passport;
  const headers = { [ORGANIZATION_ID_HEADER]: orgaId, "Content-Type": "application/json" };
  const response = await request.post(`${ApiBase}/templates/import`, {
    data: templateData,
    headers,
  });
  expect(response.ok()).toBeTruthy();
  return await response.json();
}

export async function deleteTemplate(request: any, orgaId: string, templateId: string) {
  const headers = { [ORGANIZATION_ID_HEADER]: orgaId };
  await request.delete(`${ApiBase}/templates/${templateId}`, { headers });
}
