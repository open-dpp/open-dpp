import { Locator, Page } from "@playwright/test";
import { expect } from "../fixtures";

export class EditConfigDialog {
  constructor(
    public readonly dialog: Locator,
    public readonly page: Page,
  ) {}

  async isLoaded() {
    await expect(this.dialog.getByLabel("Konfigurationsname")).toBeVisible();
    await expect(this.dialog.getByLabel("Id-Feld")).toBeVisible();
    await expect(this.dialog.getByText("Felder zuordnen")).toBeVisible();
  }

  async fillName(name: string) {
    await this.dialog.getByLabel("Konfigurationsname").fill(name);
  }

  async addMapping(inputField: string, outputField: string, outputFieldId: string) {
    await this.dialog.getByTestId("Eingabefeld").click();
    await this.page.getByText(inputField).click();

    await this.dialog.getByTestId("Zielfeld").click();
    await this.page.getByText(outputField).click();
    await this.dialog.getByRole("button", { name: "Add Mapping" }).first().click();
    await expect(this.dialog.getByRole("row").filter({ hasText: inputField })).toBeVisible();
    await expect(this.dialog.getByRole("row").filter({ hasText: outputFieldId })).toBeVisible();
  }

  async save() {
    await this.dialog.getByRole("button", { name: "Speichern" }).click();
    // Wait for success notification
    await expect(
      this.page.getByText("Bulk-Import-Konfiguration erfolgreich aktualisiert."),
    ).toBeVisible();
  }
}
