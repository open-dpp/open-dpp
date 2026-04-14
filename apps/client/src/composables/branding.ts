import type { BrandingDto } from "@open-dpp/dto";
import type { AxiosResponse } from "axios";
import type { Ref } from "vue";
import type { MediaFile } from "../lib/media";
import { updatePreset } from "@primeuix/themes";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import apiClient from "../lib/api-client";
import { createColorPalette } from "../lib/color";
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

  const src = computed(() => logo.value ? logo.value.url : "/api/branding/instance/logo");

  const applyBranding = async () => {
    try {
      const response = await requestLogo();
      cleanupMediaUrls();
      if (response.status === HTTPCode.OK) {
        if (response.data.logo) {
          const mediaResult = await mediaStore.fetchMedia(response.data.logo);
          if (mediaResult && mediaResult.blob) {
            logo.value = {
              blob: mediaResult.blob,
              mediaInfo: mediaResult.mediaInfo,
              url: createObjectUrl(mediaResult.blob),
            };
          }
        }

        let primary = "#6bad87";

        if (response.data.primaryColor && response.data.primaryColor !== null) {
          primary = `#${response.data.primaryColor}`;
        }

        const colorPalette = createColorPalette(primary);

        updatePreset({
          semantic: {
            primary: {
              ...colorPalette,
            },
          },
        });

        document.documentElement.style.setProperty(
          "--primary-500",
          colorPalette[500],
        );

        document.documentElement.style.setProperty(
          "--primary-600",
          colorPalette[600],
        );
      }
    }
    catch (error) {
      errorHandlingStore.logErrorWithNotification(
        t("presentation.loadPassportMediaError"),
        error,
      );
    }
  };

  return { logo, src, applyBranding };
};

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

export function useBrandingAnonymous(upi: Ref<string>) {
  const { src, applyBranding } = useBrandingCommon(async () => apiClient.dpp.uniqueProductIdentifiers.getBranding(upi.value));

  watch(
    () => upi.value,
    async (newValue) => {
      if (newValue) {
        await applyBranding();
      }
    },
    { immediate: true },
  );

  return { src, applyBranding };
}
