import { EnvConfig } from "../config";
import { expect, test } from "../fixtures";

const PROFILE = `${EnvConfig.OPEN_DPP_URL}/profile`;

test("editing first/last name persists across reload", async ({ makeDisposableUser }) => {
  const { page } = await makeDisposableUser();
  const stamp = Date.now().toString().slice(-6);
  const first = `First-${stamp}`;
  const last = `Last-${stamp}`;

  await page.goto(PROFILE);
  const firstInput = page.locator("#profile-first-name");
  await expect(firstInput).toBeVisible({ timeout: 15000 });
  await expect(firstInput).toBeEnabled();

  await firstInput.fill(first);
  await page.locator("#profile-last-name").fill(last);

  const save = page.getByRole("button", { name: "Änderungen speichern" });
  await expect(save).toBeEnabled();
  await save.click();
  await expect(page.getByText("Profil aktualisiert")).toBeVisible();

  await page.reload();
  await expect(page.locator("#profile-first-name")).toHaveValue(first, { timeout: 15000 });
  await expect(page.locator("#profile-last-name")).toHaveValue(last);
});

test("the save button is gated on a dirty form and discard reverts edits", async ({
  makeDisposableUser,
}) => {
  const { page } = await makeDisposableUser();

  await page.goto(PROFILE);
  const firstInput = page.locator("#profile-first-name");
  await expect(firstInput).toBeVisible({ timeout: 15000 });
  const original = await firstInput.inputValue();

  const save = page.getByRole("button", { name: "Änderungen speichern" });
  const discard = page.getByRole("button", { name: "Änderungen verwerfen" });

  // Clean load: save disabled, no discard.
  await expect(save).toBeDisabled();
  await expect(discard).toHaveCount(0);

  // Edit -> dirty.
  await firstInput.fill(`${original}-edited`);
  await expect(save).toBeEnabled();
  await expect(discard).toBeVisible();

  // Discard -> revert.
  await discard.click();
  await expect(firstInput).toHaveValue(original);
  await expect(save).toBeDisabled();
  await expect(discard).toHaveCount(0);
});
