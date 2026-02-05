import type { MediaFile } from "../lib/media.ts";
import { defineStore, storeToRefs } from "pinia";
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import apiClient from "../lib/api-client.ts";
import { createObjectUrl, revokeObjectUrl } from "../lib/media.ts";
import { useErrorHandlingStore } from "./error.handling.ts";
import { HTTPCode } from "./http-codes.ts";
import { useIndexStore } from "./index.ts";
import { useMediaStore } from "./media.ts";

export const useBrandingStore = defineStore("branding", () => {
  const logo = ref<MediaFile>();
  const mediaStore = useMediaStore();
  const errorHandlingStore = useErrorHandlingStore();
  const { t } = useI18n();
  const indexStore = useIndexStore();
  const { selectedOrganization } = storeToRefs(indexStore); // keeps reactivity

  const cleanupMediaUrls = () => {
    if (logo.value) {
      revokeObjectUrl(logo.value.url);
      logo.value = undefined;
    }
  };

  const applyBranding = async () => {
    cleanupMediaUrls();
    try {
      const response = await apiClient.dpp.branding.get();
      if (response.status === HTTPCode.OK && response.data.logo) {
        const mediaResult = await mediaStore.fetchMedia(response.data.logo);
        if (mediaResult && mediaResult.blob) {
          logo.value = {
            blob: mediaResult.blob,
            mediaInfo: mediaResult.mediaInfo,
            url: createObjectUrl(mediaResult.blob),
          };
        }
      }
    }
    catch (error) {
      errorHandlingStore.logErrorWithNotification(
        t("presentation.loadPassportMediaError"),
        error,
      );
    }
  };

  watch(
    () => selectedOrganization.value,
    async (newVal) => {
      if (newVal) {
        await applyBranding();
      }
    },
    {
      immediate: true,
    },
  );
  return { logo, applyBranding };
});
