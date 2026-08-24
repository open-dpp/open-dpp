import { EnvConfig } from "../config";
import { expect, test } from "../fixtures";

const API_KEYS = `${EnvConfig.OPEN_DPP_URL}/profile/api-keys`;

test("api key happy path: create, shown once, masked list, revoke", async ({
  makeDisposableUser,
}) => {
  const { page } = await makeDisposableUser();

  await page.goto(API_KEYS);
  await expect(page.getByTestId("api-key-create-btn")).toBeVisible({ timeout: 15000 });

  // Create
  await page.getByTestId("api-key-create-btn").click();
  await page.getByTestId("api-key-name-input").fill("E2E key");
  await page.getByTestId("api-key-create-submit").click();

  // Shown exactly once
  const createdValue = page.getByTestId("api-key-created-value");
  await expect(createdValue).toBeVisible();
  const plainKey = (await createdValue.inputValue()).trim();
  expect(plainKey).toMatch(/^opendpp_/);
  await expect(page.getByTestId("api-key-show-once-hint")).toBeVisible();
  await page.getByTestId("api-key-created-done").click();
  await expect(createdValue).toHaveCount(0);

  // Masked list: shows only the start characters, never the full key
  const maskedCell = page.locator('[data-testid^="api-key-masked-"]');
  await expect(maskedCell).toBeVisible();
  const maskedText = (await maskedCell.textContent())?.trim() ?? "";
  expect(maskedText).toMatch(/^opendpp_/);
  expect(maskedText).not.toContain(plainKey);
  await expect(page.getByText("E2E key")).toBeVisible();

  // Revoke
  await page.locator('[data-testid^="api-key-revoke-btn-"]').click();
  await page.locator(".p-confirmdialog-accept-button").click();
  await expect(page.getByTestId("api-keys-empty")).toBeVisible();
});
