import { expect, test } from "@playwright/test";
import { ApiBase } from "../config";

// Anonymous (no auth, no Mailpit): a garbage token hits the real backend revoke
// endpoint and must redirect to the public "invalid" view.
test("revoking with an invalid token redirects to the invalid view", async ({ page }) => {
  await page.goto(`${ApiBase}/users/email-change/revoke?token=not-a-valid-token`);

  await expect(page).toHaveURL(/\/account\/email-change-revoked\?status=invalid/);
  await expect(page.getByTestId("revoke-invalid")).toBeVisible();
  await expect(page.getByTestId("revoke-success")).toHaveCount(0);
  await expect(page.getByTestId("revoke-error")).toHaveCount(0);
});
