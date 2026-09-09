/** Accessibility: the public passport view against WCAG 2.x rules (EN 301 549 via EN 18216). */
import AxeBuilder from "@axe-core/playwright";
import { newAnonymousContext } from "../helpers/anonymous";
import { check, expect } from "./checks";
import { readSubject } from "./subject";

check(
  {
    id: "a11y.public-view-no-serious-violations",
    title: "the public passport view has no critical or serious axe-core violations",
    criteria: ["ESPR-Art11(b)"],
  },
  async ({ browser }) => {
    const subject = readSubject();
    const anonymous = await newAnonymousContext(browser);
    const page = await anonymous.newPage();
    await page.goto(subject.publicUrl);
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    const serious = results.violations
      .filter((v) => v.impact === "critical" || v.impact === "serious")
      .map((v) => `${v.id} (${v.impact}, ${v.nodes.length} nodes): ${v.help}`);
    expect(serious, `${results.violations.length} violations in total`).toEqual([]);
    await anonymous.close();
  },
);
