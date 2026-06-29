import { EnvConfig } from "../config";
import { uniqueEmail } from "../helpers/disposable-user";
import { requestEmailChange } from "../helpers/email-change";
import { MailpitClient } from "../helpers/mailpit";
import { expect, test } from "../fixtures";

const PROFILE = `${EnvConfig.OPEN_DPP_URL}/profile`;

test("verifying the link sent to the new address completes the email change", async ({
  makeDisposableUser,
  mailpit,
}) => {
  const { page, user } = await makeDisposableUser();
  const newEmail = uniqueEmail("e2e-verify-new");
  const since = new Date();

  await page.goto(PROFILE);
  await expect(page.getByText(user.email)).toBeVisible({ timeout: 15000 });

  await requestEmailChange(page, newEmail, user.password);
  await expect(page.getByText(`Wartet auf Bestätigung an ${newEmail}`)).toBeVisible();
  await expect(page.getByTestId("cancel-pending")).toBeVisible();

  const verification = await mailpit.waitForMessage({
    to: newEmail,
    subjectContains: "Confirm your new email address",
    since,
  });
  await page.goto(MailpitClient.getVerifyLink(verification));

  // Force a fresh getMe and assert the change landed: new email is now current,
  // the pending state is gone (change-email button back, no cancel-pending).
  await page.goto(PROFILE);
  await expect(page.getByText(newEmail)).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId("change-email")).toBeVisible();
  await expect(page.getByTestId("cancel-pending")).toHaveCount(0);

  // Best-effort: the completion courtesy mail reaches the new address.
  await mailpit.waitForMessage({
    to: newEmail,
    subjectContains: "Your email address was changed",
    since,
  });
});
