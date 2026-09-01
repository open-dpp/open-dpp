import { EnvConfig } from "../config";
import { expect, test } from "../fixtures";
import { createBatteryTemplate, deleteTemplate } from "../api/templates";
import { getOrganizationId } from "../helpers/organizations";
import {
  createBulkImportConfig,
  createBulkImportRun,
  deleteBulkImportConfig,
} from "../api/bulk-import";
import { BulkImportRunDetailPage } from "./bulk-import-run-detail.page";

test.use({ storageState: "playwright/.auth/user.json" });

test("Bulk import run processes all rows and shows created passports", async ({
  page,
  request,
}) => {
  await page.goto(EnvConfig.OPEN_DPP_URL);
  const orgaId = await getOrganizationId(page);

  const templateId = (await createBatteryTemplate(request, orgaId)).id;
  const configName = `Test Config-${Date.now()}`;
  const config = await createBulkImportConfig(request, orgaId, templateId, configName);

  const rows = [
    { id: `E2E-${Date.now()}-1`, sku: "Industrial" },
    { id: `E2E-${Date.now()}-2`, sku: "EV" },
  ];
  const run = await createBulkImportRun(request, orgaId, config.id, rows);

  const runDetailPage = new BulkImportRunDetailPage(page, orgaId, run.id);
  await runDetailPage.goto();
  await runDetailPage.isLoaded();

  await runDetailPage.waitForFinished();

  await expect(runDetailPage.statusTag()).toHaveText("Abgeschlossen");
  await expect(runDetailPage.succeededValue()).toHaveText("2");
  await expect(runDetailPage.failedValue()).toHaveText("0");
  await expect(runDetailPage.totalValue()).toHaveText("2");

  const createdRows = runDetailPage.itemRows().filter({ hasText: "Erstellt" });
  await expect(createdRows).toHaveCount(2);

  await expect(runDetailPage.passportLinks()).toHaveCount(2);

  // Cleanup
  await deleteBulkImportConfig(request, orgaId, config.id);
  await deleteTemplate(request, orgaId, templateId);
});
