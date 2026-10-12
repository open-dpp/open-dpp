/** Privacy of the public view (EN 18246 5.1): what an anonymous visit loads, asks and touches. */
import type { Page } from "@playwright/test";
import { newAnonymousContext } from "../helpers/anonymous";
import { check, expect } from "./checks";
import { readSubject } from "./subject";

/** Loads the view, scrolls it through so lazy content loads too, and waits for the network. */
const visit = async (page: Page, publicUrl: string): Promise<void> => {
  await page.goto(`${publicUrl}?lang=en`);
  await page.waitForLoadState("networkidle");
  await page.mouse.wheel(0, 20000);
  await page.waitForLoadState("networkidle");
};

check(
  {
    id: "privacy.public-view-first-party-only",
    title: "the public passport view requests nothing from an origin other than the instance's own",
    criteria: ["EN18246-5.1.3(3)"],
  },
  async ({ browser }) => {
    const subject = readSubject();
    const own = new URL(subject.publicUrl).origin;
    const anonymous = await newAnonymousContext(browser);
    const page = await anonymous.newPage();
    const foreign: string[] = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (["http:", "https:"].includes(url.protocol) && url.origin !== own) {
        foreign.push(request.url());
      }
    });
    await visit(page, subject.publicUrl);
    expect(foreign, "requests to third-party origins").toEqual([]);
    await anonymous.close();
  },
);

/**
 * Records every call of a device function the view could make: position, notifications and push,
 * camera and microphone, permission queries, network and battery information, installation
 * (service worker), sharing and vibration. Runs before any script of the page.
 */
const probeDeviceFunctions = (): void => {
  const calls: string[] = [];
  (window as unknown as { __deviceCalls: string[] }).__deviceCalls = calls;
  const wrap = (owner: object | undefined, name: string, label: string): void => {
    const target = owner as Record<string, unknown> | undefined;
    const original = target?.[name];
    if (!target || typeof original !== "function") return;
    target[name] = function (this: unknown, ...args: unknown[]) {
      calls.push(label);
      return (original as (...a: unknown[]) => unknown).apply(this, args);
    };
  };
  const watchGetter = (owner: object | undefined, name: string, label: string): void => {
    if (!owner) return;
    const descriptor = Object.getOwnPropertyDescriptor(owner, name);
    if (!descriptor?.get) return;
    const get = descriptor.get;
    Object.defineProperty(owner, name, {
      ...descriptor,
      get(this: unknown) {
        calls.push(label);
        return get.call(this);
      },
    });
  };
  const w = window as unknown as Record<string, { prototype?: object } | undefined>;
  wrap(w.Geolocation?.prototype, "getCurrentPosition", "geolocation");
  wrap(w.Geolocation?.prototype, "watchPosition", "geolocation");
  wrap(w.Notification, "requestPermission", "notifications");
  wrap(w.ServiceWorkerRegistration?.prototype, "showNotification", "notifications");
  wrap(w.PushManager?.prototype, "subscribe", "push");
  wrap(w.MediaDevices?.prototype, "getUserMedia", "camera-microphone");
  wrap(w.MediaDevices?.prototype, "enumerateDevices", "camera-microphone");
  wrap(w.Permissions?.prototype, "query", "permission-query");
  wrap(w.ServiceWorkerContainer?.prototype, "register", "install");
  wrap(w.Navigator?.prototype, "share", "share");
  wrap(w.Navigator?.prototype, "vibrate", "vibrate");
  wrap(w.Navigator?.prototype, "getBattery", "battery");
  watchGetter(w.Navigator?.prototype, "connection", "network-information");
};

check(
  {
    id: "privacy.public-view-no-device-functions",
    title:
      "the public passport view calls no device function (position, notifications, camera, network, install)",
    criteria: ["EN18246-5.1.6(2)"],
  },
  async ({ browser }) => {
    const subject = readSubject();
    const anonymous = await newAnonymousContext(browser);
    await anonymous.addInitScript(probeDeviceFunctions);
    const page = await anonymous.newPage();
    await visit(page, subject.publicUrl);
    const calls = await page.evaluate(
      () => (window as unknown as { __deviceCalls: string[] }).__deviceCalls,
    );
    expect(calls, "device functions the view called").toEqual([]);
    await anonymous.close();
  },
);

const PERSONAL_DATA_FIELDS = [
  "input[type=email]",
  "input[type=tel]",
  "input[type=password]",
  'input[autocomplete~="name"]',
  'input[autocomplete~="given-name"]',
  'input[autocomplete~="family-name"]',
  'input[autocomplete~="email"]',
  'input[autocomplete~="tel"]',
  'input[autocomplete*="address"]',
  'input[autocomplete~="bday"]',
].join(", ");

check(
  {
    id: "privacy.public-view-asks-no-personal-data",
    title:
      "an anonymous visit to the public view offers no field for personal data and gets no cookie",
    criteria: ["EN18246-5.1.6(1)"],
  },
  async ({ browser }) => {
    const subject = readSubject();
    const anonymous = await newAnonymousContext(browser);
    const page = await anonymous.newPage();
    await visit(page, subject.publicUrl);
    await expect(page.locator(PERSONAL_DATA_FIELDS), "fields asking for personal data").toHaveCount(
      0,
    );
    expect(await anonymous.cookies(), "cookies set on the visitor").toEqual([]);
    await anonymous.close();
  },
);
