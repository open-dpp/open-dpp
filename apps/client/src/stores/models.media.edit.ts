import type { ModelDto } from "@open-dpp/api-client";
import type { MediaInfo } from "../components/media/MediaInfo.interface.ts";
import type { MediaFile } from "../lib/media.ts";
import { GranularityLevel } from "@open-dpp/api-client";
import { defineStore } from "pinia";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import apiClient from "../lib/api-client";
import { createObjectUrl } from "../lib/media.ts";
import { useErrorHandlingStore } from "./error.handling.ts";
import { useMediaStore } from "./media.ts";

export const useModelsMediaStore = defineStore("models.media", () => {
  const granularityLevel = ref<GranularityLevel>(GranularityLevel.MODEL);
  const model = ref<ModelDto>();
  const fetchInFlight = ref<boolean>(false);
  const mediaStore = useMediaStore();
  const mediaFileCache = ref<Map<string, MediaFile>>(new Map());
  const mediaFiles = ref<MediaFile[]>([]);
  const errorHandlingStore = useErrorHandlingStore();
  const { t } = useI18n();

  const fetchModel = async (id: string) => {
    fetchInFlight.value = true;
    try {
      const response = await apiClient.dpp.models.getById(id);
      granularityLevel.value = GranularityLevel.MODEL;
      model.value = response.data;
    }
    catch (e) {
      errorHandlingStore.logErrorWithNotification(t("models.mediaEditDialog.loadModelError"), e);
    }
    fetchInFlight.value = false;
  };

  const fetchAndAddMediaIfNotExists = async (mediaReference: string) => {
    if (!mediaFileCache.value.has(mediaReference)) {
      const mediaFile = await mediaStore.fetchMedia(mediaReference);
      mediaFileCache.value.set(mediaReference, {
        ...mediaFile,
        url: mediaFile.blob ? createObjectUrl(mediaFile.blob) : "",
      });
    }
  };

  const updateMediaFiles = () => {
    mediaFiles.value
      = model.value?.mediaReferences
        .map(m => mediaFileCache.value.get(m))
        .filter(m => m !== undefined) ?? [];
  };

  const loadMedia = async () => {
    if (model.value) {
      for (const mediaReference of model.value.mediaReferences) {
        await fetchAndAddMediaIfNotExists(mediaReference);
        updateMediaFiles();
      }
    }
  };

  const addMediaReference = async (mediaInfo: MediaInfo) => {
    if (model.value) {
      try {
        const response = await apiClient.dpp.models.addMediaReference(
          model.value.id,
          {
            id: mediaInfo.id,
          },
        );
        model.value = response.data;
        await fetchAndAddMediaIfNotExists(mediaInfo.id);
        updateMediaFiles();
      }
      catch (e) {
        errorHandlingStore.logErrorWithNotification(
          t("models.mediaEditDialog.addImageError"),
          e,
        );
      }
    }
  };

  const removeMediaReference = async (mediaInfo: MediaInfo) => {
    if (model.value) {
      try {
        const response = await apiClient.dpp.models.deleteMediaReference(
          model.value.id,
          mediaInfo.id,
        );
        model.value = response.data;
        mediaFileCache.value.delete(mediaInfo.id);
        updateMediaFiles();
      }
      catch (e) {
        errorHandlingStore.logErrorWithNotification(
          t("models.mediaEditDialog.deleteImageError"),
          e,
        );
      }
    }
  };

  const modifyMediaReference = async (
    mediaInfo: MediaInfo,
    newMediaInfo: MediaInfo,
  ) => {
    if (model.value) {
      try {
        const response = await apiClient.dpp.models.modifyMediaReference(
          model.value.id,
          mediaInfo.id,
          {
            id: newMediaInfo.id,
          },
        );
        model.value = response.data;
        await fetchAndAddMediaIfNotExists(newMediaInfo.id);
        mediaFileCache.value.delete(mediaInfo.id);
        updateMediaFiles();
      }
      catch (e) {
        errorHandlingStore.logErrorWithNotification(
          t("models.mediaEditDialog.modifyImageError"),
          e,
        );
      }
    }
  };

  const moveMediaReference = async (
    mediaInfo: MediaInfo,
    newPosition: number,
  ) => {
    if (model.value) {
      try {
        const response = await apiClient.dpp.models.moveMediaReference(
          model.value.id,

          mediaInfo.id,
          { position: newPosition },
        );
        model.value = response.data;
        updateMediaFiles();
      }
      catch (e) {
        errorHandlingStore.logErrorWithNotification(
          t("models.mediaEditDialog.moveImageError"),
          e,
        );
      }
    }
  };

  return {
    granularityLevel,
    fetchInFlight,
    mediaFiles,
    fetchModel,
    addMediaReference,
    removeMediaReference,
    moveMediaReference,
    modifyMediaReference,
    loadMedia,
  };
});
