import { InstanceSettings } from "../../domain/instance-settings";

/**
 * ponytail: per-replica in-memory copy of the stored settings. An update is visible at
 * once on the replica that handled it and within the TTL everywhere else.
 */
export class InstanceSettingsCache {
  // the one piece of state a cache needs; set() replaces the entry, never edits it
  private entry: { readonly settings: InstanceSettings; readonly cachedAt: number } | undefined;

  constructor(private readonly ttlMs: number) {}

  /** The cached settings, or `undefined` when nothing is cached or the TTL has passed. */
  get(): InstanceSettings | undefined {
    // performance.now() is monotonic, so wall-clock jumps (NTP, manual changes) can't skew the TTL
    if (!this.entry || performance.now() - this.entry.cachedAt >= this.ttlMs) {
      return undefined;
    }
    return this.entry.settings;
  }

  set(settings: InstanceSettings): void {
    this.entry = { settings, cachedAt: performance.now() };
  }
}
