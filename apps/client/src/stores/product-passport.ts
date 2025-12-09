import type { ProductPassportDto } from "@open-dpp/api-client";
import type { MediaFile } from "../lib/media.ts";
import { defineStore } from "pinia";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { createObjectUrl, revokeObjectUrl } from "../lib/media.ts";
import { useErrorHandlingStore } from "./error.handling.ts";
import { useMediaStore } from "./media.ts";

export const useProductPassportStore = defineStore("productPassport", () => {
  const { t } = useI18n();
  const errorHandlingStore = useErrorHandlingStore();
  const mediaStore = useMediaStore();

  const productPassport = ref<ProductPassportDto>();
  const organizationImage = ref<MediaFile>();
  const mediaFiles = ref<MediaFile[]>([]);

  const findSubSections = (sectionId: string) => {
    return productPassport.value?.dataSections.filter(
      s => s.parentId === sectionId,
    );
  };

  const findSection = (sectionId: string) => {
    return productPassport.value?.dataSections.find(s => s.id === sectionId);
  };

  /**
   * Revokes all current object URLs and clears mediaFiles.
   * Components using this store should call this function from onBeforeUnmount
   * to prevent memory leaks.
   */
  const cleanupMediaUrls = () => {
    for (const mediaFile of mediaFiles.value) {
      if (mediaFile.url) {
        revokeObjectUrl(mediaFile.url);
      }
    }
    if (organizationImage.value) {
      revokeObjectUrl(organizationImage.value.url);
      organizationImage.value = undefined;
    }
    mediaFiles.value = [];
  };

  /**
   * Loads media files for the current product passport.
   * Revokes previous object URLs before creating new ones to prevent memory leaks.
   */
  const loadMedia = async () => {
    // Cleanup previous object URLs before creating new ones
    cleanupMediaUrls();
    if (productPassport.value) {
      for (const mediaReference of productPassport.value.mediaReferences) {
        try {
          const mediaFile = await mediaStore.fetchMedia(mediaReference);
          if (mediaFile && mediaFile.blob) {
            mediaFiles.value.push({
              ...mediaFile,
              url: createObjectUrl(mediaFile.blob),
            });
          }
        }
        catch (error) {
          errorHandlingStore.logErrorWithNotification(t("presentation.loadPassportMediaError"), error);
        }
      }
      if (productPassport.value?.organizationImage) {
        try {
          const mediaResult = await mediaStore.fetchMedia(productPassport.value.organizationImage);
          if (mediaResult && mediaResult.blob) {
            organizationImage.value = {
              blob: mediaResult.blob,
              mediaInfo: mediaResult.mediaInfo,
              url: createObjectUrl(mediaResult.blob),
            };
          }
        }
        catch (error) {
          errorHandlingStore.logErrorWithNotification(t("presentation.loadPassportMediaError"), error);
        }
      }
    }
  };

  return { productPassport, mediaFiles, loadMedia, findSubSections, findSection, cleanupMediaUrls, organizationImage };
});
