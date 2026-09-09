/** Access control: who can read what, observed through the API and the public view. */
import { ApiBase, AuthBase, EnvConfig } from "../config";
import { newAnonymousContext } from "../helpers/anonymous";
import { DEFAULT_PASSWORD, uniqueEmail } from "../helpers/disposable-user";
import { ORG_ID_HEADER } from "../helpers/passport";
import { check, expect } from "./checks";
import { readSubject } from "./subject";

const publicApi = (publicUrl: string): string => {
  const id = publicUrl.slice(publicUrl.indexOf("/p/") + 3).split(/[?#]/)[0];
  return `${ApiBase}/p/${id}`;
};

check(
  {
    id: "access.anonymous-reads-published",
    title: "anyone reads a published passport through its public view and the public API",
    criteria: ["ESPR-Art11(b)", "ESPR-Art9(2)(f)", "BATT-AnnexXIII-1", "CPR-Art76(2)(e)", "DET-Art22(d)", "TOYS-Art20(4)"],
  },
  async ({ browser }) => {
    const subject = readSubject();
    const anonymous = await newAnonymousContext(browser);
    const api = await anonymous.request.get(publicApi(subject.publicUrl));
    expect(api.status(), "public API").toBe(200);
    const page = await anonymous.newPage();
    const view = await page.goto(subject.publicUrl);
    expect(view?.status(), "public view").toBe(200);
    await anonymous.close();
  },
);

check(
  {
    id: "access.anonymous-denied-management",
    title: "anonymous requests to the management API of a passport are refused",
    criteria: ["ESPR-Art10(1)(g)", "ESPR-Art11(f)", "ESPR-Art9(2)(g)", "CPR-Art77(1)(g)", "CPR-Art76(2)(g)"],
  },
  async ({ browser }) => {
    const subject = readSubject();
    const anonymous = await newAnonymousContext(browser);
    const response = await anonymous.request.get(`${ApiBase}/passports/${subject.passportId}`, {
      headers: { [ORG_ID_HEADER]: subject.orgId },
    });
    expect([401, 403]).toContain(response.status());
    await anonymous.close();
  },
);

check(
  {
    id: "access.foreign-user-denied-management",
    title: "a signed-in user outside the owning organisation cannot read or modify the passport",
    criteria: ["ESPR-Art11(f)", "ESPR-Art9(2)(g)", "CPR-Art76(2)(g)"],
  },
  async ({ playwright }) => {
    const subject = readSubject();
    // A fresh outsider, authenticated over the API only: the request context keeps the session
    // cookie, and the Origin header better-auth requires for sign-up/sign-in never reaches Mailpit.
    const outsider = await playwright.request.newContext({
      extraHTTPHeaders: { Origin: EnvConfig.OPEN_DPP_URL },
    });
    const email = uniqueEmail("conf-outsider");
    const signUp = await outsider.post(`${AuthBase}/sign-up/email`, {
      data: {
        email,
        password: DEFAULT_PASSWORD,
        firstName: "Out",
        lastName: "Sider",
        name: "Out Sider",
        preferredLanguage: "de",
        callbackURL: "/",
      },
    });
    expect(signUp.ok(), `sign-up (${signUp.status()})`).toBeTruthy();
    const signIn = await outsider.post(`${AuthBase}/sign-in/email`, {
      data: { email, password: DEFAULT_PASSWORD },
    });
    expect(signIn.ok(), `sign-in (${signIn.status()})`).toBeTruthy();

    try {
      const read = await outsider.get(`${ApiBase}/passports/${subject.passportId}`, {
        headers: { [ORG_ID_HEADER]: subject.orgId },
      });
      expect([401, 403, 404], "read").toContain(read.status());
      const write = await outsider.put(`${ApiBase}/passports/${subject.passportId}/status`, {
        headers: { [ORG_ID_HEADER]: subject.orgId },
        data: { method: "Archive" },
      });
      expect([401, 403, 404], "write").toContain(write.status());
    } finally {
      await outsider.dispose();
    }
  },
);
