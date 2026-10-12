/** Accessibility: the public passport view against WCAG 2.x rules (EN 301 549 via EN 18216). */
import AxeBuilder from "@axe-core/playwright";
import { newAnonymousContext } from "../helpers/anonymous";
import { check, expect } from "./checks";
import { readSubject } from "./subject";

check(
  {
    id: "a11y.public-view-no-serious-violations",
    title: "the public passport view has no critical or serious axe-core violations",
    criteria: [
      "ESPR-Art11(b)",
      "EN18216-5-para3",
      "EN301549-9.6",
      "EN18246-5.4.1-sub1",
      "EN18246-5.4.3(1)",
      "EN18220-5.7.4-sub1",
    ],
  },
  async ({ browser }) => {
    const subject = readSubject();
    const anonymous = await newAnonymousContext(browser);
    const page = await anonymous.newPage();
    await page.goto(subject.publicUrl);
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const serious = results.violations
      .filter((v) => v.impact === "critical" || v.impact === "serious")
      .map((v) => `${v.id} (${v.impact}, ${v.nodes.length} nodes): ${v.help}`);
    expect(serious, `${results.violations.length} violations in total`).toEqual([]);
    await anonymous.close();
  },
);

check(
  {
    id: "a11y.page-language-follows-selection",
    title: "the public view declares the language a visitor selected as the page language",
    criteria: ["EN301549-9.3.1.1"],
  },
  async ({ browser }) => {
    const subject = readSubject();
    const anonymous = await newAnonymousContext(browser);
    const page = await anonymous.newPage();
    // The subject carries German labels, so the view offers German next to English.
    await page.goto(`${subject.publicUrl}?lang=de`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("html")).toHaveAttribute("lang", /^de\b/);
    await anonymous.close();
  },
);

check(
  {
    id: "a11y.page-title-names-passport",
    title: "the public view's page title names the passport it shows",
    criteria: ["EN301549-9.2.4.2"],
  },
  async ({ browser }) => {
    const subject = readSubject();
    const anonymous = await newAnonymousContext(browser);
    const page = await anonymous.newPage();
    await page.goto(`${subject.publicUrl}?lang=en`);
    await page.waitForLoadState("networkidle");
    // The General information card shows the passport's name next to the "Name" term.
    const name = (
      await page
        .locator("dt", { hasText: /^Name$/ })
        .first()
        .locator("+ dd")
        .innerText()
    ).trim();
    expect(name, "the view shows the passport name").not.toEqual("");
    expect(await page.title()).toContain(name);
    await anonymous.close();
  },
);
