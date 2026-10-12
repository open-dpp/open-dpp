/**
 * Data carriers (EN 18220): the QR Code the back office renders for each of the subject's permalinks,
 * read back with an independent decoder (jsQR) and measured for the quiet zone that ISO/IEC 18004
 * requires and EN 18220 restates as four modules.
 */
import type { APIRequestContext, Page } from "@playwright/test";
import jsQR from "jsqr";
import { ApiBase } from "../config";
import { newAnonymousContext } from "../helpers/anonymous";
import { gotoPermalinkList, ORG_ID_HEADER } from "../helpers/passport";
import { check, expect } from "./checks";
import { readSubject } from "./subject";

type Listed<T> = T[] | { result?: T[]; data?: T[]; items?: T[] };
type Permalink = { id: string; kind: string; publicUrl: string };
type Bitmap = { width: number; height: number; data: number[] };

/** Quiet zone ISO/IEC 18004:2024 requires around a QR Code, in modules (EN 18220, notes of Annexes A to C). */
const REQUIRED_QUIET_ZONE_MODULES = 4;
/** Modules across a finder pattern's outer dark ring. */
const FINDER_PATTERN_MODULES = 7;

const items = <T>(body: Listed<T>): T[] =>
  Array.isArray(body) ? body : (body.result ?? body.data ?? body.items ?? []);

const subjectPermalinks = async (request: APIRequestContext): Promise<Permalink[]> => {
  const { orgId, passportId } = readSubject();
  const list = await request.get(`${ApiBase}/passports/${passportId}/permalinks`, {
    headers: { [ORG_ID_HEADER]: orgId },
  });
  expect(list.ok(), "the subject's permalinks should be listed").toBeTruthy();
  const permalinks = items((await list.json()) as Listed<Permalink>);
  expect(permalinks.length, "the published subject has permalinks").toBeGreaterThan(0);
  return permalinks;
};

/** Opens a permalink's QR dialog in the back office and returns the URL it shows and the canvas pixels. */
const renderedQr = async (
  page: Page,
  permalinkId: string,
): Promise<{ shownUrl: string; bitmap: Bitmap }> => {
  await page.getByTestId(`permalink-show-qr-btn-${permalinkId}`).click();
  const dialog = page.getByRole("dialog");
  const shownUrl = (await dialog.getByTestId("permalink-qr-url").innerText()).trim();
  const canvas = dialog.locator("canvas");
  await expect(canvas).toBeVisible();
  const bitmap = await canvas.evaluate((element) => {
    const canvasElement = element as HTMLCanvasElement;
    const context = canvasElement.getContext("2d");
    if (!context) throw new Error("the QR canvas has no 2D context");
    const { data } = context.getImageData(0, 0, canvasElement.width, canvasElement.height);
    return { width: canvasElement.width, height: canvasElement.height, data: Array.from(data) };
  });
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  return { shownUrl, bitmap };
};

const isDark = (bitmap: Bitmap, x: number, y: number): boolean => {
  const i = (y * bitmap.width + x) * 4;
  const luminance = 0.299 * bitmap.data[i] + 0.587 * bitmap.data[i + 1] + 0.114 * bitmap.data[i + 2];
  return bitmap.data[i + 3] > 127 && luminance < 128;
};

/** Narrowest light margin between the symbol and the canvas edge, in modules of the rendered symbol. */
const quietZoneModules = (bitmap: Bitmap): number => {
  let [left, top, right, bottom] = [bitmap.width, bitmap.height, -1, -1];
  for (let y = 0; y < bitmap.height; y++) {
    for (let x = 0; x < bitmap.width; x++) {
      if (!isDark(bitmap, x, y)) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  expect(right, "the canvas shows a symbol").toBeGreaterThan(left);
  // The top row of the top-left finder pattern is a run of seven dark modules.
  let run = 0;
  while (left + run < bitmap.width && isDark(bitmap, left + run, top)) run++;
  const moduleSize = run / FINDER_PATTERN_MODULES;
  const margins = [left, top, bitmap.width - 1 - right, bitmap.height - 1 - bottom];
  return Math.min(...margins) / moduleSize;
};

check(
  {
    id: "carriers.qr-decodes-to-passport-link",
    title: "every permalink's QR Code decodes, with an independent decoder, to its URL, which opens the passport anonymously",
    criteria: [
      "EN18220-5.2.1-sub1",
      "EN18220-5.2.3-sub1",
      "EN18220-5.3.4-sub1",
      "EN18220-5.3.4-sub2",
      "EN18220-5.6.1",
      "EN18220-5.8.1-sub1",
      "EN18220-5.8.2",
      "EN18220-6.1(2)",
      "EN18220-6.2.3",
      "EN18220-6.2.4.1",
      "EN18219-4.5.2(1)",
      "EN18246-5.2.1(4)",
      "ESPR-Art10(1)(a)",
      "BATT-Art13(6)",
      "BATT-Art13(6)(a)",
      "BATT-Art77(3)-sub1",
    ],
  },
  async ({ page, request, browser }) => {
    const subject = readSubject();
    const permalinks = await subjectPermalinks(request);
    expect(
      permalinks.map((p) => p.publicUrl),
      "one permalink carries the subject's GS1 Digital Link",
    ).toContain(subject.digitalLink);
    await gotoPermalinkList(page, { orgId: subject.orgId, passportId: subject.passportId });
    const anonymous = await newAnonymousContext(browser);
    for (const permalink of permalinks) {
      const { shownUrl, bitmap } = await renderedQr(page, permalink.id);
      expect(shownUrl, `the dialog of ${permalink.kind} shows its URL`).toBe(permalink.publicUrl);
      const decoded = jsQR(Uint8ClampedArray.from(bitmap.data), bitmap.width, bitmap.height);
      expect(decoded?.data, `the ${permalink.kind} QR Code decodes to its URL`).toBe(
        permalink.publicUrl,
      );
      const opened = await anonymous.request.get(permalink.publicUrl);
      expect(opened.ok(), `the decoded ${permalink.kind} URL opens without an account`).toBeTruthy();
    }
    await anonymous.close();
  },
);

check(
  {
    id: "carriers.qr-quiet-zone-four-modules",
    title: "the rendered QR Code keeps a light quiet zone of at least four modules on every side",
    criteria: [
      "EN18220-6.2.3",
      "EN18220-5.6.1",
      "EN18220-5.1",
      "EN18219-4.5.2(1)",
      "EN18246-5.2.1(4)",
      "ESPR-Art10(1)(b)",
      "ESPR-Art10(1)(c)",
      "BATT-Art13(6)",
    ],
  },
  async ({ page, request }) => {
    const subject = readSubject();
    const permalinks = await subjectPermalinks(request);
    await gotoPermalinkList(page, { orgId: subject.orgId, passportId: subject.passportId });
    for (const permalink of permalinks) {
      const { bitmap } = await renderedQr(page, permalink.id);
      const modules = quietZoneModules(bitmap);
      expect(
        modules,
        `the ${permalink.kind} QR Code's quiet zone, in modules`,
      ).toBeGreaterThanOrEqual(REQUIRED_QUIET_ZONE_MODULES - 0.1);
    }
  },
);
