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

test("Bulk import run can be interrupted while running", async ({ page, request }) => {
  await page.goto(EnvConfig.OPEN_DPP_URL);
  const orgaId = await getOrganizationId(page);

  const templateId = (await createBatteryTemplate(request, orgaId)).id;
  const configName = `Test Config-${Date.now()}`;
  const config = await createBulkImportConfig(request, orgaId, templateId, configName);

  // The backend only re-checks for an interruption every 50 processed items, so the run
  // needs enough rows (max allowed is 1000) that several of those checkpoints still lie
  // ahead of us by the time the page has loaded and we click Interrupt - otherwise the run
  // may finish processing before our click has any effect.
  const rows = Array.from({ length: 1000 }, (_, i) => ({
    id: `E2E-interrupt-${Date.now()}-${i}`,
    sku: "Industrial",
  }));
  const run = await createBulkImportRun(request, orgaId, config.id, rows);

  const runDetailPage = new BulkImportRunDetailPage(page, orgaId, run.id);
  await runDetailPage.goto();
  await runDetailPage.isLoaded();

  await runDetailPage.interrupt();
  await runDetailPage.waitForFinished(30_000);

  await expect(runDetailPage.statusTag()).toHaveText("Unterbrochen");
  await expect(runDetailPage.interruptButton()).toBeDisabled();

  const [succeeded, failed, total] = await Promise.all([
    runDetailPage.succeededCount(),
    runDetailPage.failedCount(),
    runDetailPage.totalCount(),
  ]);
  expect(total).toBe(1000);
  expect(succeeded + failed).toBeLessThan(total);

  // Interrupting again is a no-op - the button stays disabled and the status doesn't change.
  await runDetailPage.refresh();
  await expect(runDetailPage.statusTag()).toHaveText("Unterbrochen");
  await expect(runDetailPage.interruptButton()).toBeDisabled();

  // Cleanup
  await deleteBulkImportConfig(request, orgaId, config.id);
  await deleteTemplate(request, orgaId, templateId);
});
