/** Transport security: the public view is served with HTTPS hardening headers. */
import { EnvConfig } from "../config";
import { newAnonymousContext } from "../helpers/anonymous";
import { check, expect } from "./checks";
import { readSubject } from "./subject";
import { test } from "../fixtures";

check(
  {
    id: "transport.hsts-on-public-view",
    title: "the public view answers with Strict-Transport-Security over HTTPS",
    criteria: ["ESPR-Art11(g)", "BATT-Art78(g)"],
  },
  async ({ browser }) => {
    test.skip(
      !EnvConfig.OPEN_DPP_URL.startsWith("https://"),
      "instance under test is served over plain http; HSTS only applies to HTTPS deployments",
    );
    const subject = readSubject();
    const anonymous = await newAnonymousContext(browser);
    const response = await anonymous.request.get(subject.publicUrl);
    expect(response.headers()["strict-transport-security"]).toMatch(/max-age=\d+/);
    await anonymous.close();
  },
);
