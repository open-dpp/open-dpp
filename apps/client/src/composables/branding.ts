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

function useBrandingCommon(requestBranding: () => Promise<AxiosResponse<BrandingDto>>) {
  const errorHandlingStore = useErrorHandlingStore();
  const mediaStore = useMediaStore();
  const { t } = useI18n();

  const cleanupMediaUrls = () => {
    if (logo.value) {
      revokeObjectUrl(logo.value.url);
      logo.value = undefined;
    }
  };

  const src = computed(() => (logo.value ? logo.value.url : "/api/branding/instance/logo"));

  const applyPrimaryColor = (primaryColor?: string | null) => {
    let primary = "#6bad87";

    if (primaryColor) {
      primary = `#${primaryColor}`;
    }

    const colorPalette = createColorPalette(primary);

    updatePreset({
      semantic: {
        primary: {
          ...colorPalette,
        },
      },
    });

    document.documentElement.style.setProperty("--primary-500", colorPalette[500]);

    document.documentElement.style.setProperty("--primary-600", colorPalette[600]);
  };

  const applyLogo = async (newLogo?: string | null) => {
    cleanupMediaUrls();
    if (newLogo) {
      try {
        const mediaResult = await mediaStore.fetchMedia(newLogo);
        if (mediaResult && mediaResult.blob) {
          logo.value = {
            blob: mediaResult.blob,
            mediaInfo: mediaResult.mediaInfo,
            url: createObjectUrl(mediaResult.blob),
          };
        }
      } catch (logoError) {
        errorHandlingStore.logErrorWithNotification(
          t("presentation.loadPassportMediaError"),
          logoError,
        );
      }
    } else {
      logo.value = undefined;
    }
  };

  const applyBranding = async () => {
    try {
      const response = await requestBranding();
      if (response.status === HTTPCode.OK) {
        applyPrimaryColor(response.data.primaryColor);
        applyLogo(response.data.logo);
      } else {
        errorHandlingStore.logErrorWithNotification(t("presentation.loadPassportMediaError"));
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

export function useBrandingAnonymous(upi: Ref<string>) {
  const { src, applyBranding } = useBrandingCommon(async () =>
    apiClient.dpp.uniqueProductIdentifiers.getBranding(upi.value),
  );

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
