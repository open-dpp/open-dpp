import { EnvConfig, API_VERSION } from "../config";
import { expect, test } from "../fixtures";

const BULK_IMPORT_URL = (orgaId: string) =>
  `${EnvConfig.OPEN_DPP_URL}/organizations/${orgaId}/integrations/bulk-import`;
const API_BASE = `${EnvConfig.OPEN_DPP_URL}/api/${API_VERSION}`;

// Helper to create a minimal template
async function createTemplate(request: any, orgaId: string) {
  const templateData = {
    environment: {
      assetAdministrationShells: [
        {
          displayName: [{ language: "en", text: `Test Shell-${Date.now()}` }],
          description: [],
        },
      ],
    },
  };
  const headers = { "X-OPEN-DPP-ORGANIZATION-ID": orgaId };
  const response = await request.post(`${API_BASE}/templates`, {
    data: templateData,
    headers,
  });
  expect(response.ok()).toBeTruthy();
  return (await response.json()).id;
}

// Helper to create a bulk import config
async function createBulkImportConfig(
  request: any,
  orgaId: string,
  templateId: string,
  name: string,
) {
  const configData = {
    templateId,
    name,
    idField: "id",
    submodelMappings: [
      {
        submodelIdShort: "TechnicalData",
        fieldMappings: [{ input: "sku", output: "properties.sku" }],
      },
    ],
  };
  const headers = { "X-OPEN-DPP-ORGANIZATION-ID": orgaId };
  const response = await request.post(`${API_BASE}/bulk-import/configs`, {
    data: configData,
    headers,
  });
  expect(response.ok()).toBeTruthy();
  return await response.json();
}

// Helper to delete a bulk import config
async function deleteBulkImportConfig(request: any, orgaId: string, configId: string) {
  const headers = { "X-OPEN-DPP-ORGANIZATION-ID": orgaId };
  await request.delete(`${API_BASE}/bulk-import/configs/${configId}`, { headers });
}

// Helper to delete a template
async function deleteTemplate(request: any, orgaId: string, templateId: string) {
  const headers = { "X-OPEN-DPP-ORGANIZATION-ID": orgaId };
  await request.delete(`${API_BASE}/templates/${templateId}`, { headers });
}

test.use({ storageState: "playwright/.auth/user.json" });

test("Bulk import config edit dialog opens and can edit configuration name", async ({
  page,
  request,
}) => {
  await page.goto(EnvConfig.OPEN_DPP_URL);
  const orgaId = await page.evaluate(() =>
    localStorage.getItem("open-dpp-local-last-selected-organization-id"),
  );

  const headers = { "X-OPEN-DPP-ORGANIZATION-ID": orgaId };

  // Create a template via API
  const templateId = await createTemplate(request, orgaId);

  // Create a bulk import config via API
  const configName = `Test Config-${Date.now()}`;
  const createdConfig = await createBulkImportConfig(request, orgaId, templateId, configName);
  const configId = createdConfig.id;

  // Navigate to bulk import page
  await page.goto(BULK_IMPORT_URL(orgaId));
  await expect(page.getByText("Bulk-Import").first()).toBeVisible();

  // Find and click the edit button for our config
  const row = page.getByRole("row").filter({ hasText: configName });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Editieren" }).click();

  // Wait for the edit dialog to open
  const dialog = page.getByRole("dialog", { name: "Konfiguration bearbeiten" });
  await expect(dialog).toBeVisible();

  // Verify the dialog has the expected fields
  await expect(dialog.getByLabel("Konfigurationsname")).toBeVisible();
  await expect(dialog.getByLabel("Id-Feld")).toBeVisible();
  await expect(dialog.getByText("Felder zuordnen")).toBeVisible();

  // Edit the configuration name
  const newName = `${configName}-edited`;
  await dialog.getByLabel("Konfigurationsname").fill(newName);

  // Click save
  await dialog.getByRole("button", { name: "Speichern" }).click();

  // Wait for success notification
  await expect(page.getByText("Bulk-Import-Konfiguration erfolgreich aktualisiert.")).toBeVisible();

  // Verify the dialog closed
  await expect(dialog).not.toBeVisible();

  // Verify the config name was updated in the table
  await expect(page.getByRole("row").filter({ hasText: newName })).toBeVisible();

  // Cleanup: delete the config and template via API
  await deleteBulkImportConfig(request, orgaId, configId);
  await deleteTemplate(request, orgaId, templateId);
});

test("Bulk import config edit dialog validates required fields", async ({ page, request }) => {
  await page.goto(EnvConfig.OPEN_DPP_URL);
  const orgaId = await page.evaluate(() =>
    localStorage.getItem("open-dpp-local-last-selected-organization-id"),
  );

  // Create a template via API
  const templateId = await createTemplate(request, orgaId);

  // Create a bulk import config via API
  const configName = `Test Config-${Date.now()}`;
  const createdConfig = await createBulkImportConfig(request, orgaId, templateId, configName);
  const configId = createdConfig.id;

  // Navigate to bulk import page
  await page.goto(BULK_IMPORT_URL(orgaId));
  await expect(page.getByText("Bulk-Import").first()).toBeVisible();

  // Open edit dialog
  const row = page.getByRole("row").filter({ hasText: configName });
  await row.getByRole("button", { name: "Editieren" }).click();

  const dialog = page.getByRole("dialog", { name: "Konfiguration bearbeiten" });
  await expect(dialog).toBeVisible();

  // Clear the name field
  await dialog.getByLabel("Konfigurationsname").fill("");

  // Save button should be disabled
  await expect(dialog.getByRole("button", { name: "Speichern" })).toBeDisabled();

  // Cleanup
  await deleteBulkImportConfig(request, orgaId, configId);
  await deleteTemplate(request, orgaId, templateId);
});
