import type { ProductPassportDto } from "@open-dpp/api-client";
import type { MediaFile } from "../lib/media.ts";
import { defineStore } from "pinia";
import { ref } from "vue";
import { revokeObjectUrl } from "../lib/media.ts";
import { useMediaStore } from "./media.ts";

export const useProductPassportStore = defineStore("productPassport", () => {
  const productPassport = ref<ProductPassportDto>();
  const mediaFiles = ref<MediaFile[]>([]);
  const mediaStore = useMediaStore();

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
    mediaFiles.value = [];
  };

  /**
   * Loads media files for the current product passport.
   * Revokes previous object URLs before creating new ones to prevent memory leaks.
   */
  const loadMedia = async () => {
    if (productPassport.value) {
      // Cleanup previous object URLs before creating new ones
      cleanupMediaUrls();

      for (const mediaReference of productPassport.value.mediaReferences) {
        const mediaFile = await mediaStore.fetchMedia(mediaReference);
        mediaFiles.value.push({
          ...mediaFile,
          url: mediaFile.blob ? URL.createObjectURL(mediaFile.blob) : "",
        });
      }
    }
  };

  return { productPassport, mediaFiles, loadMedia, findSubSections, findSection, cleanupMediaUrls };
});
