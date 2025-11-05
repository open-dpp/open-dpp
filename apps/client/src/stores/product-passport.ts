import type { ProductPassportDto } from "@open-dpp/api-client";
import type { MediaFile } from "../lib/media.ts";
import { defineStore } from "pinia";
import { ref } from "vue";
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

  const loadMedia = async () => {
    if (productPassport.value) {
      mediaFiles.value = [];
      for (const mediaReference of productPassport.value.mediaReferences) {
        const mediaFile = await mediaStore.fetchMedia(mediaReference);
        mediaFiles.value.push({
          ...mediaFile,
          url: mediaFile.blob ? URL.createObjectURL(mediaFile.blob) : "",
        });
      }
    }
  };

  return { productPassport, mediaFiles, loadMedia, findSubSections, findSection };
});
