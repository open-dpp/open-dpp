import type { BrandingDto } from "@open-dpp/dto";
import type { AxiosResponse } from "axios";
import type { Ref } from "vue";
import type { MediaFile } from "../lib/media";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import apiClient from "../lib/api-client";
import { createObjectUrl, revokeObjectUrl } from "../lib/media";
import { useIndexStore } from "../stores";
import { useErrorHandlingStore } from "../stores/error.handling";
import { HTTPCode } from "../stores/http-codes";
import { useMediaStore } from "../stores/media";

const logo = ref<MediaFile>();

function useBrandingCommon(requestLogo: () => Promise<AxiosResponse<BrandingDto>>) {
  const errorHandlingStore = useErrorHandlingStore();
  const mediaStore = useMediaStore();
  const { t } = useI18n();

  const cleanupMediaUrls = () => {
    if (logo.value) {
      revokeObjectUrl(logo.value.url);
      logo.value = undefined;
    }
  };

  const src = computed(() => (logo.value ? logo.value.url : "/api/branding/instance"));

  const applyBranding = async () => {
    try {
      const response = await requestLogo();
      cleanupMediaUrls();
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
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(t("presentation.loadPassportMediaError"), error);
    }
  };

  return { logo, src, applyBranding };
}

export function useBranding() {
  const { src, applyBranding } = useBrandingCommon(async () => await apiClient.dpp.branding.get());
  const indexStore = useIndexStore();

  watch(
    () => indexStore.selectedOrganization,
    async (newValue) => {
      if (newValue) {
        await applyBranding();
      }
    },
    { immediate: true },
  );

  return { src, applyBranding };
}

export function useBrandingAnonymous(permalink: Ref<string>) {
  const { src, applyBranding } = useBrandingCommon(async () =>
    apiClient.dpp.permalinks.getBranding(permalink.value),
  );

  watch(
    () => permalink.value,
    async (newValue) => {
      if (newValue) {
        await applyBranding();
      }
    },
    { immediate: true },
  );

  return { src, applyBranding };
}
