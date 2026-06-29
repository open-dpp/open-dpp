import { EnvConfig } from "../config";
import { uniqueEmail } from "../helpers/disposable-user";
import { requestEmailChange } from "../helpers/email-change";
import { MailpitClient } from "../helpers/mailpit";
import { expect, test } from "../fixtures";

const PROFILE = `${EnvConfig.OPEN_DPP_URL}/profile`;

// ADR-0001 end-to-end: revoking from the OLD-address notification link must
// permanently defeat an otherwise-valid verification link clicked afterwards.
test("revoking via the notification link blocks a later, still-valid verification link", async ({
  makeDisposableUser,
  mailpit,
}) => {
  const { page, user } = await makeDisposableUser();
  const newEmail = uniqueEmail("e2e-gate-new");
  const since = new Date();

  await page.goto(PROFILE);
  await expect(page.getByText(user.email)).toBeVisible({ timeout: 15000 });

  await requestEmailChange(page, newEmail, user.password);
  await expect(page.getByText(`Wartet auf Bestätigung an ${newEmail}`)).toBeVisible();

  // Revoke link -> OLD/current address; verification link -> NEW address.
  // (The old address also holds the earlier signup mail, hence the subject filter.)
  const notification = await mailpit.waitForMessage({
    to: user.email,
    subjectContains: "Your email is being changed",
    since,
  });
  const revokeLink = MailpitClient.getRevokeLink(notification);

  const verification = await mailpit.waitForMessage({
    to: newEmail,
    subjectContains: "Confirm your new email address",
    since,
  });
  const verifyLink = MailpitClient.getVerifyLink(verification);

  // 1) Revoke via the public link (backend 302 -> the revoked view).
  await page.goto(revokeLink);
  await expect(page).toHaveURL(/\/account\/email-change-revoked\?status=ok/);
  await expect(page.getByTestId("revoke-success")).toBeVisible();

  // 2) The still-valid verification token must now be a no-op (the gate).
  await page.goto(verifyLink);

  // 3) Email is UNCHANGED and no pending request remains.
  await page.goto(PROFILE);
  await expect(page.getByText(user.email)).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(newEmail)).toHaveCount(0);
  await expect(page.getByTestId("change-email")).toBeVisible();
  await expect(page.getByTestId("cancel-pending")).toHaveCount(0);
});
