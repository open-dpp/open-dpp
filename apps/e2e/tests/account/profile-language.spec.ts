import { EnvConfig } from "../config";
import { expect, test } from "../fixtures";

const PROFILE = `${EnvConfig.OPEN_DPP_URL}/profile`;

// The branch wires applyMe -> locale.value, so saving a language change flips the
// live UI locale, and main.ts re-applies preferredLanguage on the next bootstrap.
test("switching language flips the live UI locale and persists across reload", async ({
  makeDisposableUser,
}) => {
  // Disposable user starts in German (preferredLanguage 'de' + de-DE context).
  const { page } = await makeDisposableUser({ preferredLanguage: "de" });

  await page.goto(PROFILE);
  await expect(page.locator("#profile-first-name")).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("heading", { name: "Sprache" })).toBeVisible();

  // Switch DE -> EN and save.
  await page.getByRole("button", { name: "Englisch" }).click();
  const save = page.getByRole("button", { name: "Änderungen speichern" });
  await expect(save).toBeEnabled();
  await save.click();

  // Live flip: the language heading is now rendered in English.
  await expect(page.getByRole("heading", { name: "Language" })).toBeVisible({ timeout: 15000 });

  // Persists across a fresh bootstrap.
  await page.reload();
  await expect(page.getByRole("heading", { name: "Language" })).toBeVisible({ timeout: 15000 });
});
