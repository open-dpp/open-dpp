import type { APIRequestContext, Browser, BrowserContext, Page } from "@playwright/test";
import { ApiBase, EnvConfig } from "../config";
import { expect, test } from "../fixtures";
import { newAnonymousContext } from "../helpers/anonymous";
import { DEFAULT_PASSWORD, uniqueEmail } from "../helpers/disposable-user";
import { MailpitClient } from "../helpers/mailpit";
import {
  createBlankPassport,
  ORG_ID_HEADER,
  publishPassport,
  type PassportIds,
} from "../helpers/passport";
import { GuestAccessListPage } from "./guest-access-list.page";
import { GuestInvitationPage } from "./guest-invitation.page";
import { ProductPage } from "./product.page";
import { SigninPage } from "./signin.page";
import { SignupPage } from "./signup.page";

// The setup user, who owns the organization of these specs, prefers German
const INVITATION_SUBJECT = "Einladung zum Zugriff";
const VERIFY_SUBJECT = "Verify E-Mail address";
const REVOKED_SUBJECT = "Dein Gastzugriff wurde entzogen";

/** Visible to repairers only: the public rule of this section is deleted. */
const GUEST_SECTION = "GuestOnly";

/** A visitor without a session who sees the application in German, like the setup user. */
async function guestContext(browser: Browser): Promise<BrowserContext> {
  return browser.newContext({ storageState: { cookies: [], origins: [] }, locale: "de-DE" });
}

function ownerHeaders(ids: PassportIds) {
  return { [ORG_ID_HEADER]: ids.orgId };
}

/**
 * A published passport with a single section which the public cannot read, because its public
 * rule is deleted, while the default rule of every guest role (Read) stays.
 */
async function createPassportWithGuestOnlySection(page: Page): Promise<{
  ids: PassportIds;
  permalinkId: string;
}> {
  const ids = await createBlankPassport(page);
  await publishPassport(page, ids);

  const created = await page.request.post(`${ApiBase}/passports/${ids.passportId}/submodels`, {
    headers: ownerHeaders(ids),
    data: { idShort: GUEST_SECTION },
  });
  expect(created.ok(), "adding the section should succeed").toBeTruthy();

  const property = (idShort: string, value: string) => ({
    idShort,
    value,
    valueType: "xs:string",
    extensions: [],
    displayName: [],
    description: [],
    supplementalSemanticIds: [],
    qualifiers: [],
    embeddedDataSpecifications: [],
  });
  const deleted = await page.request.delete(
    `${ApiBase}/passports/${ids.passportId}/security/policies`,
    {
      headers: ownerHeaders(ids),
      data: {
        subject: { subjectAttribute: [property("userRole", "anonymous")] },
        object: GUEST_SECTION,
      },
    },
  );
  expect(deleted.ok(), "deleting the public rule should succeed").toBeTruthy();

  const permalinks = await page.request.get(`${ApiBase}/p?passportId=${ids.passportId}`);
  const permalinkId = (await permalinks.json())[0]?.id as string;
  expect(permalinkId, "the published passport should have a permalink").toBeTruthy();
  return { ids, permalinkId };
}

async function sectionsSeenBy(request: APIRequestContext, permalinkId: string): Promise<string[]> {
  const response = await request.get(`${ApiBase}/p/${permalinkId}/submodels`);
  expect(response.status()).toBe(200);
  return ((await response.json()).result as { idShort: string }[]).map((s) => s.idShort);
}

async function guestAccessIdOf(page: Page, ids: PassportIds, email: string): Promise<string> {
  const response = await page.request.get(`${ApiBase}/guest-accesses`, {
    headers: ownerHeaders(ids),
  });
  expect(response.ok()).toBeTruthy();
  const found = ((await response.json()) as { id: string; email: string }[]).find(
    (access) => access.email === email,
  );
  expect(found, `a guest access for ${email} should be listed`).toBeDefined();
  return found!.id;
}

test.describe("guest access", () => {
  test("a new person is invited, signs up, verifies the address, accepts and sees the guest-only section until the access is revoked", async ({
    page,
    browser,
    mailpit,
  }) => {
    const { ids, permalinkId } = await createPassportWithGuestOnlySection(page);
    const guestEmail = uniqueEmail("guest");
    const since = new Date();

    // The owner invites by email
    const guestList = new GuestAccessListPage(page, ids.orgId);
    await guestList.goto();
    await guestList.invite(guestEmail, /Reparateur|Repairer/i);

    const invitation = await mailpit.waitForMessage({
      to: guestEmail,
      subjectContains: INVITATION_SUBJECT,
      since,
    });
    const link = MailpitClient.getGuestInvitationLink(invitation);
    // No account exists for the address, so the link opens the sign up
    expect(new URL(link).pathname).toBe("/signup");

    // The guest signs up with the address of the invitation, which cannot be changed
    const guest = await guestContext(browser);
    const guestPage = await guest.newPage();
    const signup = new SignupPage(guestPage);
    await signup.goto(link);
    await signup.expectEmailLocked(guestEmail);
    await signup.signUp("Rita", "Repair", DEFAULT_PASSWORD);

    // Not the onboarding of new organizations: back to the invitation, which asks for the
    // verification of the address
    const invitationPage = new GuestInvitationPage(guestPage);
    await invitationPage.waitForPage();
    await invitationPage.expectState("unverified");
    await expect(invitationPage.invitation()).toContainText(guestEmail);

    // The verification link leads back to the invitation
    const verification = await mailpit.waitForMessage({
      to: guestEmail,
      subjectContains: VERIFY_SUBJECT,
      since,
    });
    await guestPage.goto(MailpitClient.getVerifyLink(verification));
    await invitationPage.waitForPage();
    await invitationPage.expectState("pending");
    await expect(invitationPage.invitation()).toContainText(/Reparateur|Repairer/);

    // Nothing is visible before the acceptance
    expect(await sectionsSeenBy(guest.request, permalinkId)).toEqual([]);

    await invitationPage.accept();
    await invitationPage.expectState("accepted");

    // The guest sees the section which the public cannot see
    expect(await sectionsSeenBy(guest.request, permalinkId)).toEqual([GUEST_SECTION]);
    const anonymous = await newAnonymousContext(browser);
    expect(await sectionsSeenBy(anonymous.request, permalinkId)).toEqual([]);

    // The owner sees the accepted guest and revokes the access
    await page.reload();
    const accessId = await guestAccessIdOf(page, ids, guestEmail);
    await expect(guestList.statusOf(accessId)).toHaveText(/Angenommen|Accepted/);
    await guestList.revoke(accessId);
    await expect(guestList.statusOf(accessId)).toHaveText(/Entzogen|Revoked/);

    // The next request of the guest is already without the section, and the guest was told
    expect(await sectionsSeenBy(guest.request, permalinkId)).toEqual([]);
    await mailpit.waitForMessage({ to: guestEmail, subjectContains: REVOKED_SUBJECT, since });

    await anonymous.close();
    await guest.close();
  });

  test("an invitation for an existing account leads a signed-in user straight to the acceptance", async ({
    page,
    mailpit,
    makeDisposableUser,
  }) => {
    const { ids } = await createPassportWithGuestOnlySection(page);
    const existing = await makeDisposableUser({ verified: true });
    const since = new Date();

    const invited = await page.request.post(`${ApiBase}/guest-accesses`, {
      headers: ownerHeaders(ids),
      data: { kind: "Direct", email: existing.user.email, guestRole: "Repairer" },
    });
    expect(invited.status()).toBe(201);

    const invitation = await mailpit.waitForMessage({
      to: existing.user.email,
      subjectContains: INVITATION_SUBJECT,
      since,
    });
    const link = MailpitClient.getGuestInvitationLink(invitation);
    // The address has an account, so the link opens the sign in
    expect(new URL(link).pathname).toBe("/signin");

    // The user is signed in in this browser: no sign in, the invitation is shown right away
    await existing.page.goto(link);
    const invitationPage = new GuestInvitationPage(existing.page);
    await invitationPage.waitForPage();
    await invitationPage.expectState("pending");
    await invitationPage.accept();
    await invitationPage.expectState("accepted");

    // Another browser: the same link asks to sign in with the invited address
    const other = await guestContext(existing.page.context().browser()!);
    const otherPage = await other.newPage();
    const signin = new SigninPage(otherPage);
    await signin.goto(link);
    await signin.expectEmailLocked(existing.user.email);
    await other.close();
  });

  test("a visitor of a product page can sign in as professional and returns to the page", async ({
    page,
    browser,
    makeDisposableUser,
  }) => {
    const { permalinkId } = await createPassportWithGuestOnlySection(page);
    const professional = await makeDisposableUser({ verified: true });

    const visitor = await guestContext(browser);
    const visitorPage = await visitor.newPage();
    const product = new ProductPage(visitorPage, permalinkId);
    await product.goto();
    await product.signInAsProfessional();

    const signin = new SigninPage(visitorPage);
    await signin.waitForPage();
    await signin.signIn(professional.user.email, professional.user.password);

    await product.waitForPage();
    // Signed in, the entry for professionals is gone
    await expect(product.professionalSignIn()).toHaveCount(0);
    await visitor.close();
  });
});
