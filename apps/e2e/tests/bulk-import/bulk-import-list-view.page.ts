import { Page } from "@playwright/test";
import { EnvConfig } from "../config";
import { expect } from "../fixtures";
import { EditConfigDialog } from "./edit-config.dialog";

export class BulkImportListViewPage {
  constructor(
    public readonly page: Page,
    private readonly orgaId: string,
  ) {}

  async goto() {
    await this.page.goto(
      `${EnvConfig.OPEN_DPP_URL}/organizations/${this.orgaId}/integrations/bulk-import`,
    );
  }

  async isLoaded() {
    await expect(this.page.getByText("Bulk-Import").first()).toBeVisible();
  }

  async editBulkImportConfig(configName: string): Promise<EditConfigDialog> {
    const row = this.page.getByRole("row").filter({ hasText: configName });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "Editieren" }).click();
    const dialog = this.page.getByRole("dialog", { name: "Konfiguration bearbeiten" });
    await expect(dialog).toBeVisible();
    return new EditConfigDialog(dialog, this.page);
  }
}
