import type {
  DataSectionDto,
  DataValueDto,
  ProductPassportDto,
  UniqueProductIdentifierDto,
} from "@open-dpp/api-client";
import type { MediaFile } from "../lib/media.ts";
import { GranularityLevel } from "@open-dpp/api-client";
import { assign, keys, pick } from "lodash";
import { defineStore } from "pinia";
import { ref } from "vue";
import apiClient from "../lib/api-client";
import { createObjectUrl, revokeObjectUrl } from "../lib/media.ts";
import { i18n } from "../translations/i18n.ts";
import { useErrorHandlingStore } from "./error.handling.ts";
import { useMediaStore } from "./media.ts";

export type DataValues = Record<string, unknown>;

export const usePassportFormStore = defineStore("passport.form", () => {
  const granularityLevel = ref<GranularityLevel>(GranularityLevel.MODEL);
  const productPassport = ref<ProductPassportDto>();
  const uniqueProductIdentifier = ref<UniqueProductIdentifierDto>();
  const modelId = ref<string>();
  const fetchInFlight = ref<boolean>(false);
  const { t } = i18n.global;
  const errorHandlingStore = useErrorHandlingStore();
  const mediaStore = useMediaStore();
  const mediaFiles = ref<
    MediaFile[]
  >([]);

  const VALUE_FOR_OTHER_GRANULARITY_LEVEL = {
    [GranularityLevel.MODEL]: t("builder.granularity.setOnModel"),
    [GranularityLevel.ITEM]: t("builder.granularity.setOnItem"),
  };

  const getValueForOtherGranularityLevel = () => {
    return VALUE_FOR_OTHER_GRANULARITY_LEVEL[granularityLevel.value];
  };

  const getDataOfSection = (sectionId: string): DataValues[] => {
    return (
      productPassport.value?.dataSections.find(s => s.id === sectionId)
        ?.dataValues ?? []
    );
  };

  const findSubSections = (sectionId: string | undefined): DataSectionDto[] => {
    return (
      productPassport.value?.dataSections.filter(
        s => s.parentId === sectionId,
      ) ?? []
    );
  };

  const getFormData = (
    sectionId: string,
    existingFormData: DataValues,
    row: number = 0,
  ) => {
    const dataValues = getDataOfSection(sectionId)[row];
    return assign({}, dataValues, pick(existingFormData, keys(dataValues)));
  };

  const findSectionById = (sectionId: string) => {
    return productPassport.value?.dataSections.find(s => s.id === sectionId);
  };

  const generateDataValues = (sectionId: string): DataValueDto[] => {
    const section = productPassport.value?.dataSections.find(
      s => s.id === sectionId,
    );
    if (!section) {
      return [];
    }
    const maxRow = section.dataValues.length - 1;

    const dataValuesToCreate = [];
    for (const subSectionId of section.subSections) {
      dataValuesToCreate.push(...generateDataValues(subSectionId));
    }
    dataValuesToCreate.push(
      ...section.dataFields.map(f => ({
        value: undefined,
        dataSectionId: section?.id,
        dataFieldId: f.id,
        row: maxRow === undefined ? 0 : maxRow + 1,
      })),
    );
    return dataValuesToCreate;
  };

  const fetchProductPassport = async () => {
    if (uniqueProductIdentifier.value) {
      const response = await apiClient.dpp.productPassports.getById(
        uniqueProductIdentifier.value.uuid,
      );
      productPassport.value = response.data;
    }
  };

  const addRowToSection = async (sectionId: string) => {
    if (modelId.value && uniqueProductIdentifier.value) {
      const dataValuesToCreate = generateDataValues(sectionId);
      if (granularityLevel.value === GranularityLevel.MODEL) {
        await apiClient.dpp.models.addData(
          uniqueProductIdentifier.value.referenceId,
          dataValuesToCreate,
        );
      }
      else {
        await apiClient.dpp.items.addData(
          modelId.value,
          uniqueProductIdentifier.value.referenceId,
          dataValuesToCreate,
        );
      }
      await fetchProductPassport();
    }
  };

  const fetchModel = async (id: string) => {
    fetchInFlight.value = true;
    const response = await apiClient.dpp.models.getById(id);
    granularityLevel.value = GranularityLevel.MODEL;
    uniqueProductIdentifier.value = response.data.uniqueProductIdentifiers[0];
    modelId.value = id;
    await fetchProductPassport();
    fetchInFlight.value = false;
  };

  const fetchItem = async (modelIdToFetch: string, id: string) => {
    fetchInFlight.value = true;
    const response = await apiClient.dpp.items.getById(modelIdToFetch, id);
    granularityLevel.value = GranularityLevel.ITEM;
    modelId.value = modelIdToFetch;
    uniqueProductIdentifier.value = response.data.uniqueProductIdentifiers[0];
    await fetchProductPassport();
    fetchInFlight.value = false;
  };

  const getUUID = () => {
    return uniqueProductIdentifier.value?.uuid;
  };

  const updateDataValues = async (
    sectionId: string,
    dataValues: DataValues,
    row: number,
  ) => {
    if (modelId.value && uniqueProductIdentifier.value) {
      const dataValueModifications = Object.entries(dataValues).map(
        ([key, value]) => ({
          dataSectionId: sectionId,
          dataFieldId: key,
          row,
          value,
        }),
      );
      if (granularityLevel.value === GranularityLevel.MODEL) {
        await apiClient.dpp.models.modifyData(
          uniqueProductIdentifier.value.referenceId,
          dataValueModifications,
        );
      }
      else {
        await apiClient.dpp.items.modifyData(
          modelId.value,
          uniqueProductIdentifier.value.referenceId,
          dataValueModifications,
        );
      }
      await fetchProductPassport();
    }
  };

  const cleanupMediaUrls = () => {
    for (const mediaFile of mediaFiles.value) {
      if (mediaFile.url) {
        revokeObjectUrl(mediaFile.url);
      }
    }
    mediaFiles.value = [];
  };

  const loadMedia = async () => {
    cleanupMediaUrls();
    if (productPassport.value) {
      for (const mediaReference of productPassport.value.mediaReferences) {
        try {
          const mediaFile = await mediaStore.fetchMedia(mediaReference);
          // Only push entries with valid blobs
          if (mediaFile && mediaFile.blob) {
            mediaFiles.value.push({
              ...mediaFile,
              url: createObjectUrl(mediaFile.blob),
            });
          }
        }
        catch (error) {
          errorHandlingStore.logErrorWithNotification(
            t("passport.form.mediaDownloadError"),
            error,
          );
        }
      }
    }
  };

  return {
    getUUID,
    granularityLevel,
    productPassport,
    fetchInFlight,
    mediaFiles,
    getValueForOtherGranularityLevel,
    fetchModel,
    fetchItem,
    loadMedia,
    findSubSections,
    findSectionById,
    updateDataValues,
    addRowToSection,
    getFormData,
  };
});
