import { expect, test } from "@playwright/test";
import { EnvConfig } from "../config";

// Anonymous (no auth, no Mailpit): a garbage token opens the public revoke
// confirmation page. The page's side-effect-free info lookup reports the token
// as invalid, so it redirects to the public "invalid" view. Loading this page is
// a non-mutating GET, so a link-scanner prefetch cannot cancel anything.
test("an invalid revoke token lands on the invalid view", async ({ page }) => {
  await page.goto(`${EnvConfig.OPEN_DPP_URL}/account/email-change-revoke?token=not-a-valid-token`);

  await expect(page).toHaveURL(/\/account\/email-change-revoked\?status=invalid/);
  await expect(page.getByTestId("revoke-invalid")).toBeVisible();
  await expect(page.getByTestId("revoke-success")).toHaveCount(0);
  await expect(page.getByTestId("revoke-error")).toHaveCount(0);
});
