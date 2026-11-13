import type { LegalLinksDto, PublicInstanceSettingsDto } from "@open-dpp/dto";
import { UserRoleDto } from "@open-dpp/dto";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import apiClient from "../lib/api-client";
import { useErrorHandlingStore } from "./error.handling";
import { useIndexStore } from "./index";
import { useUserStore } from "./user";

const ORGANIZATION_ID_PLACEHOLDER = "{organizationId}";

export interface FetchPublicSettingsOptions {
  errorMessage?: string;
}

/**
 * The public instance settings. Some fields are only sent to signed-in users, so every fetch asks
 * the server again; concurrent fetches share one request. `settings` is `null` until loaded and
 * after a failed load.
 */
export const useInstanceSettingsStore = defineStore("instance-settings", () => {
  const userStore = useUserStore();
  const indexStore = useIndexStore();
  const errorHandlingStore = useErrorHandlingStore();

  const settings = ref<PublicInstanceSettingsDto | null>(null);
  const loadFailed = ref(false);
  let pending: Promise<boolean> | null = null;

  async function load(): Promise<boolean> {
    try {
      const { data } = await apiClient.dpp.instanceSettings.getPublic();
      settings.value = data;
      loadFailed.value = false;
      return true;
    } catch (error) {
      settings.value = null;
      loadFailed.value = true;
      console.warn("Failed to fetch public instance settings:", error);
      return false;
    } finally {
      pending = null;
    }
  }

  async function fetchPublicSettings(options: FetchPublicSettingsOptions = {}): Promise<void> {
    pending ??= load();
    const loaded = await pending;
    if (!loaded && options.errorMessage) {
      errorHandlingStore.logErrorWithNotification(options.errorMessage);
    }
  }

  /**
   * Whether visitors may sign up: `false` until the settings are loaded, then the server's answer.
   * When loading fails it is `true`; the server still rejects a sign-up while signup is disabled.
   */
  const signupEnabled = computed(() => settings.value?.signupEnabled ?? loadFailed.value);

  const canCreateOrganization = computed(
    () =>
      (settings.value?.organizationCreationEnabled ?? false) ||
      userStore.user.role === UserRoleDto.ADMIN,
  );

  const usageManagementUrl = computed(() => {
    const url = settings.value?.usageManagementUrl;
    if (!url || !url.includes(ORGANIZATION_ID_PLACEHOLDER)) {
      return url;
    }
    if (!indexStore.selectedOrganization) {
      return undefined;
    }
    return url.replaceAll(
      ORGANIZATION_ID_PLACEHOLDER,
      encodeURIComponent(indexStore.selectedOrganization),
    );
  });

  const legalLinks = computed<LegalLinksDto>(() => settings.value?.legalLinks ?? {});

  const consentRequired = computed(
    () => !!legalLinks.value.termsOfServiceUrl || !!legalLinks.value.privacyPolicyUrl,
  );

  return {
    settings,
    signupEnabled,
    canCreateOrganization,
    usageManagementUrl,
    legalLinks,
    consentRequired,
    fetchPublicSettings,
  };
});
