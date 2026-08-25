import { Locator, Page } from "@playwright/test";
import { EnvConfig } from "../config";
import { expect } from "../fixtures";

export class BulkImportRunDetailPage {
  constructor(
    public readonly page: Page,
    private readonly orgaId: string,
    private readonly runId: string,
  ) {}

  async goto() {
    await this.page.goto(
      `${EnvConfig.OPEN_DPP_URL}/organizations/${this.orgaId}/integrations/bulk-import/runs/${this.runId}`,
    );
  }

  async isLoaded() {
    await expect(this.page.getByText("Importlauf").first()).toBeVisible();
  }

  private statTile(label: string): Locator {
    return this.page.locator("div.bg-white", { hasText: label }).first();
  }

  statusTag(): Locator {
    return this.statTile("Status").locator(".p-tag");
  }

  succeededValue(): Locator {
    return this.statTile("Erfolgreich").locator("span.text-4xl");
  }

  failedValue(): Locator {
    return this.statTile("Fehlgeschlagen").locator("span.text-4xl");
  }

  totalValue(): Locator {
    return this.statTile("Gesamt").locator("span.text-4xl");
  }

  private async numberFrom(locator: Locator): Promise<number> {
    return Number(await locator.textContent());
  }

  async succeededCount(): Promise<number> {
    return this.numberFrom(this.succeededValue());
  }

  async failedCount(): Promise<number> {
    return this.numberFrom(this.failedValue());
  }

  async totalCount(): Promise<number> {
    return this.numberFrom(this.totalValue());
  }

  async refresh() {
    await this.page.getByRole("button", { name: "Aktualisieren" }).click();
  }

  interruptButton(): Locator {
    return this.page.getByRole("button", { name: "Unterbrechen" });
  }

  async interrupt() {
    await this.interruptButton().click();
  }

  private itemsTable(): Locator {
    return this.page.locator(".p-datatable-table-container");
  }

  itemRows(): Locator {
    return this.itemsTable().getByRole("row").filter({ hasNotText: "Zeile" });
  }

  passportLinks(): Locator {
    return this.itemsTable().getByRole("link", { name: /^[0-9a-f-]{36}$/ });
  }

  /** Polls the run status by clicking Refresh until it leaves pending/running, or the timeout elapses. */
  async waitForFinished(timeout = 20_000) {
    await expect(async () => {
      await this.refresh();
      await expect(this.statusTag()).not.toHaveText(/Ausstehend|Läuft/, { timeout: 2_000 });
    }).toPass({ timeout });
  }
}
