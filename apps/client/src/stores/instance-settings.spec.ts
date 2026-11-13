import { UserRoleDto } from "@open-dpp/dto";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useInstanceSettingsStore } from "./instance-settings";
import { useUserStore } from "./user";

const mocks = await vi.hoisted(async () => {
  const { reactive } = await import("vue");
  return {
    getPublic: vi.fn(),
    logErrorWithNotification: vi.fn(),
    indexStore: reactive({ selectedOrganization: null as string | null }),
  };
});

vi.mock("../lib/api-client", () => ({
  default: { dpp: { instanceSettings: { getPublic: mocks.getPublic } } },
}));
vi.mock("./index", () => ({ useIndexStore: () => mocks.indexStore }));
vi.mock("./error.handling", () => ({
  useErrorHandlingStore: () => ({ logErrorWithNotification: mocks.logErrorWithNotification }),
}));

function respondWith(data: Record<string, unknown>) {
  mocks.getPublic.mockResolvedValueOnce({ data: { signupEnabled: true, legalLinks: {}, ...data } });
}

describe("instanceSettingsStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.resetAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.indexStore.selectedOrganization = null;
  });

  it("asks the server again on every fetch, sharing concurrent requests", async () => {
    const store = useInstanceSettingsStore();
    respondWith({ signupEnabled: false });

    await Promise.all([store.fetchPublicSettings(), store.fetchPublicSettings()]);
    expect(mocks.getPublic).toHaveBeenCalledOnce();
    expect(store.settings?.signupEnabled).toBe(false);

    respondWith({ signupEnabled: true });
    await store.fetchPublicSettings();
    expect(mocks.getPublic).toHaveBeenCalledTimes(2);
    expect(store.settings?.signupEnabled).toBe(true);
  });

  it("hides signup until the settings are loaded, and falls back to enabled when loading fails", async () => {
    const store = useInstanceSettingsStore();
    expect(store.signupEnabled).toBe(false);

    respondWith({ signupEnabled: true });
    await store.fetchPublicSettings();
    expect(store.signupEnabled).toBe(true);

    respondWith({ signupEnabled: false });
    await store.fetchPublicSettings();
    expect(store.signupEnabled).toBe(false);

    mocks.getPublic.mockRejectedValueOnce(new Error("Network error"));
    await store.fetchPublicSettings();
    expect(store.signupEnabled).toBe(true);
  });

  it("clears the settings and notifies only when asked to, when loading fails", async () => {
    const store = useInstanceSettingsStore();
    respondWith({ organizationCreationEnabled: true });
    await store.fetchPublicSettings();

    mocks.getPublic.mockRejectedValueOnce(new Error("Network error"));
    await store.fetchPublicSettings();
    expect(store.settings).toBeNull();
    expect(store.canCreateOrganization).toBe(false);
    expect(mocks.logErrorWithNotification).not.toHaveBeenCalled();

    mocks.getPublic.mockRejectedValueOnce(new Error("Network error"));
    await store.fetchPublicSettings({ errorMessage: "Could not load settings" });
    expect(mocks.logErrorWithNotification).toHaveBeenCalledWith("Could not load settings");
  });

  it("lets users create organizations when enabled, and admins always", async () => {
    const userStore = useUserStore();
    userStore.user.role = UserRoleDto.USER;
    const store = useInstanceSettingsStore();

    respondWith({ organizationCreationEnabled: true });
    await store.fetchPublicSettings();
    expect(store.canCreateOrganization).toBe(true);

    respondWith({ organizationCreationEnabled: false });
    await store.fetchPublicSettings();
    expect(store.canCreateOrganization).toBe(false);

    userStore.user.role = UserRoleDto.ADMIN;
    expect(store.canCreateOrganization).toBe(true);
  });

  it("exposes the usage management URL", async () => {
    const store = useInstanceSettingsStore();

    respondWith({ usageManagementUrl: "https://billing.example.com" });
    await store.fetchPublicSettings();
    expect(store.usageManagementUrl).toBe("https://billing.example.com");

    respondWith({});
    await store.fetchPublicSettings();
    expect(store.usageManagementUrl).toBeUndefined();
  });

  it("replaces the {organizationId} placeholder in the usage management URL", async () => {
    const store = useInstanceSettingsStore();
    respondWith({
      usageManagementUrl: "https://billing.example.com/organizations/{organizationId}",
    });

    await store.fetchPublicSettings();
    expect(store.usageManagementUrl).toBeUndefined();

    mocks.indexStore.selectedOrganization = "org-1";
    expect(store.usageManagementUrl).toBe("https://billing.example.com/organizations/org-1");
  });

  it.each([
    [{ imprintUrl: "https://legal.example.com/imprint" }, false],
    [{ privacyPolicyUrl: "https://legal.example.com/privacy" }, true],
    [{ termsOfServiceUrl: "https://legal.example.com/terms" }, true],
    [{}, false],
  ])("exposes the legal links %o; consent required: %s", async (legalLinks, required) => {
    const store = useInstanceSettingsStore();
    respondWith({ legalLinks });

    await store.fetchPublicSettings();

    expect(store.legalLinks).toEqual(legalLinks);
    expect(store.consentRequired).toBe(required);
  });
});
