import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { InstanceSettings } from "../../domain/instance-settings";
import { InstanceSettingsCache } from "./instance-settings.cache";

const TTL_MS = 60_000;

describe("InstanceSettingsCache", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("is empty until settings are put in", () => {
    expect(new InstanceSettingsCache(TTL_MS).get()).toBeUndefined();
  });

  it("serves the settings it holds within the TTL", () => {
    const cache = new InstanceSettingsCache(TTL_MS);
    const settings = InstanceSettings.create();

    cache.set(settings);
    jest.advanceTimersByTime(TTL_MS - 1);

    expect(cache.get()).toBe(settings);
  });

  it("expires once the TTL has passed", () => {
    const cache = new InstanceSettingsCache(TTL_MS);
    cache.set(InstanceSettings.create());

    jest.advanceTimersByTime(TTL_MS);

    expect(cache.get()).toBeUndefined();
  });

  it("restarts the TTL when settings are replaced", () => {
    const cache = new InstanceSettingsCache(TTL_MS);
    const replacement = InstanceSettings.create({ signupEnabled: { value: false } });
    cache.set(InstanceSettings.create());

    jest.advanceTimersByTime(TTL_MS - 1);
    cache.set(replacement);
    jest.advanceTimersByTime(TTL_MS - 1);

    expect(cache.get()).toBe(replacement);
  });
});
