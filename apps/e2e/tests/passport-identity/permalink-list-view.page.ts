import { expect, type Locator, type Page } from "@playwright/test";
import { acceptDeleteConfirm, type PassportIds, permalinkListUrl } from "../helpers/passport";
import { DataCarrierDialog } from "./data-carrier.dialog";
import { PermalinkCreateDialog } from "./permalink-create.dialog";
import { PermalinkEditDialog } from "./permalink-edit.dialog";

const KIND_TEST_ID_PREFIX = "permalink-kind-";

/**
 * One permalink in the list, addressed by its id. The row's controls carry the
 * permalink id in their test ids, so a row object stays valid while other rows
 * are added, deleted or re-sorted.
 */
export class PermalinkRow {
  readonly publicUrl: Locator;
  readonly deleteButton: Locator;

  constructor(
    private readonly page: Page,
    readonly id: string,
  ) {
    this.publicUrl = page.getByTestId(`permalink-public-url-${id}`);
    this.deleteButton = page.getByTestId(`permalink-delete-btn-${id}`);
  }

  async openDataCarrier(): Promise<DataCarrierDialog> {
    await this.page.getByTestId(`permalink-show-qr-btn-${this.id}`).click();
    return new DataCarrierDialog(this.page);
  }

  async edit(): Promise<PermalinkEditDialog> {
    await this.page.getByTestId(`permalink-edit-btn-${this.id}`).click();
    const dialog = new PermalinkEditDialog(this.page);
    await dialog.isLoaded();
    return dialog;
  }

  async delete(): Promise<void> {
    await this.deleteButton.click();
    await acceptDeleteConfirm(this.page);
  }
}

export class PermalinkListViewPage {
  readonly table: Locator;
  readonly rows: Locator;
  readonly createButton: Locator;
  readonly frozenInfo: Locator;

  constructor(
    public readonly page: Page,
    private readonly ids: PassportIds,
  ) {
    this.table = page.getByTestId("permalink-data-table");
    this.rows = this.table.locator("tbody tr:not(.p-datatable-empty-message)");
    this.createButton = page.getByTestId("permalink-create-btn");
    this.frozenInfo = page.getByTestId("permalink-frozen-info");
  }

  async goto(): Promise<void> {
    await this.page.goto(permalinkListUrl(this.ids));
    await this.isLoaded();
  }

  async reload(): Promise<void> {
    await this.page.reload();
    await this.isLoaded();
  }

  async isLoaded(): Promise<void> {
    await expect(this.table).toBeVisible();
  }

  async firstRow(): Promise<PermalinkRow> {
    return this.rowFor(this.rows.first());
  }

  async rowWithText(text: string | RegExp): Promise<PermalinkRow> {
    return this.rowFor(this.rows.filter({ hasText: text }));
  }

  async openCreateDialog(): Promise<PermalinkCreateDialog> {
    await this.createButton.click();
    return new PermalinkCreateDialog(this.page);
  }

  /** Creates a permalink that links the passport directly, without a product identifier. */
  async createBarePermalink(): Promise<void> {
    const dialog = await this.openCreateDialog();
    await dialog.submit();
  }

  /** Creates the GS1 Digital Link permalink of the passport's GS1 identifier with this GTIN. */
  async createGs1DigitalLink(gtin: string): Promise<void> {
    const dialog = await this.openCreateDialog();
    await dialog.selectIdentifier(gtin);
    await dialog.submit();
  }

  private async rowFor(row: Locator): Promise<PermalinkRow> {
    const testId = await row
      .locator(`[data-testid^='${KIND_TEST_ID_PREFIX}']`)
      .getAttribute("data-testid");
    expect(testId, "permalink row should expose its id through the kind cell").not.toBeNull();
    return new PermalinkRow(this.page, testId!.slice(KIND_TEST_ID_PREFIX.length));
  }
}
