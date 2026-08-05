import { EnvConfig } from "../config";
import { expect, test } from "../fixtures";
import { createBatteryTemplate, deleteTemplate } from "../api/templates";
import { getOrganizationId } from "../helpers/organizations";
import { createBulkImportConfig, deleteBulkImportConfig } from "../api/bulk-import";
import { BulkImportListViewPage } from "./bulk-import-list-view.page";

test.use({ storageState: "playwright/.auth/user.json" });

test("Bulk import config edit dialog opens and can edit configuration name", async ({
  page,
  request,
}) => {
  await page.goto(EnvConfig.OPEN_DPP_URL);
  const orgaId = await getOrganizationId(page);
  const bulkImportListViewPage = new BulkImportListViewPage(page, await getOrganizationId(page));

  // Create a template via API
  const templateId = (await createBatteryTemplate(request, orgaId)).id;

  // Create a bulk import config via API
  const configName = `Test Config-${Date.now()}`;
  const createdConfig = await createBulkImportConfig(request, orgaId, templateId, configName);
  const configId = createdConfig.id;

  // Navigate to bulk import page
  await bulkImportListViewPage.goto();
  await bulkImportListViewPage.isLoaded();
  const dialog = await bulkImportListViewPage.editBulkImportConfig(configName);
  await dialog.isLoaded();

  // Edit the configuration name
  const newName = `${configName}-edited`;
  await dialog.fillName(newName);

  // Add a new mapping
  await dialog.addMapping("batteryId", "Batterie-Kennung", "batteryIdentifier");

  await dialog.save();
  // Verify the dialog closed
  await expect(dialog.dialog).not.toBeVisible();

  // Verify the config name was updated in the table
  await expect(page.getByRole("row").filter({ hasText: newName })).toBeVisible();

  // Cleanup: delete the config and template via API
  await deleteBulkImportConfig(request, orgaId, configId);
  await deleteTemplate(request, orgaId, templateId);
});

test("Bulk import config edit dialog validates required fields", async ({ page, request }) => {
  await page.goto(EnvConfig.OPEN_DPP_URL);
  const orgaId = await getOrganizationId(page);

  // Create a template via API
  const templateId = (await createBatteryTemplate(request, orgaId)).id;

  // Create a bulk import config via API
  const configName = `Test Config-${Date.now()}`;
  const createdConfig = await createBulkImportConfig(request, orgaId, templateId, configName);
  const configId = createdConfig.id;

  // Navigate to bulk import page
  const bulkImportListViewPage = new BulkImportListViewPage(page, orgaId);

  await bulkImportListViewPage.goto();

  // Open edit dialog
  const dialog = await bulkImportListViewPage.editBulkImportConfig(configName);
  await dialog.isLoaded();
  await dialog.fillName("");

  // Save button should be disabled
  await expect(dialog.dialog.getByRole("button", { name: "Speichern" })).toBeDisabled();

  // Cleanup
  await deleteBulkImportConfig(request, orgaId, configId);
  await deleteTemplate(request, orgaId, templateId);
});
