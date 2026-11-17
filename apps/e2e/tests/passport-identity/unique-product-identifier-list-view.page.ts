import { expect, type Locator, type Page } from "@playwright/test";
import { GTIN14, type PassportIds, upiListUrl } from "../helpers/passport";

export type Gs1Identifier = { gtin?: string; batch?: string; serial?: string };

export class UniqueProductIdentifierRow {
  readonly qrButton: Locator;
  readonly createPermalinkButton: Locator;

  constructor(readonly row: Locator) {
    this.qrButton = row.getByTestId("upi-qr-btn");
    this.createPermalinkButton = row.getByTestId("upi-permalink-create");
  }
}

export class UniqueProductIdentifierListViewPage {
  readonly table: Locator;

  constructor(
    public readonly page: Page,
    private readonly ids: PassportIds,
  ) {
    this.table = page.getByTestId("upi-data-table");
  }

  async goto(): Promise<void> {
    await this.page.goto(upiListUrl(this.ids));
    await expect(this.table).toBeVisible();
  }

  /** Adds a GS1 identifier; the app then prompts to link it to a GS1 Digital Link. */
  async addGs1Identifier({ gtin = GTIN14, batch, serial }: Gs1Identifier): Promise<void> {
    await this.page.getByTestId("upi-add-btn").click();
    await this.page.getByTestId("upi-create-type").getByRole("button", { name: /^GS1$/ }).click();
    await this.page.getByTestId("upi-create-gtin").fill(gtin);
    if (batch) await this.page.getByTestId("upi-create-batch").fill(batch);
    if (serial) await this.page.getByTestId("upi-create-serial").fill(serial);
    await this.page.getByTestId("upi-create-submit").click();
    await expect(this.page.getByTestId("gs1-link-prompt-skip")).toBeVisible();
  }

  async skipGs1LinkPrompt(): Promise<void> {
    await this.page.getByTestId("gs1-link-prompt-skip").click();
  }

  rowWithText(text: string | RegExp): UniqueProductIdentifierRow {
    return new UniqueProductIdentifierRow(this.table.locator("tbody tr").filter({ hasText: text }));
  }
}
