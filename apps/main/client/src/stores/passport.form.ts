import { defineStore } from "pinia";
import { ref } from "vue";
import {
  DataSectionDto,
  DataValueDto,
  GranularityLevel,
  ProductPassportDto,
  SectionDto,
  UniqueProductIdentifierDto,
} from "@open-dpp/api-client";
import apiClient from "../lib/api-client";
import { assign, keys, pick } from "lodash";

type FormKitSchemaNode =
  | string // Text content
  | number // Number content
  | boolean // Boolean content
  | null
  | FormKitSchemaObject // Actual schema object
  | FormKitSchemaNode[]; // Array of nodes (for children or conditional rendering)

interface FormKitSchemaObject {
  $el?: string; // HTML tag or FormKit component (e.g., 'div', 'FormKit')
  $cmp?: string; // Custom Vue component (alternative to $el)
  props?: Record<string, unknown>; // Props passed to the element/component
  attrs?: Record<string, unknown>;
  children?: FormKitSchemaNode; // Child nodes (can be a node, string, or array)
}

export type DataValues = Record<string, unknown>;

export const usePassportFormStore = defineStore("passport.form", () => {
  const granularityLevel = ref<GranularityLevel>(GranularityLevel.MODEL);
  const productPassport = ref<ProductPassportDto>();
  const uniqueProductIdentifier = ref<UniqueProductIdentifierDto>();
  const modelId = ref<string>();
  const fetchInFlight = ref<boolean>(false);

  const VALUE_FOR_OTHER_GRANULARITY_LEVEL = {
    [GranularityLevel.MODEL]: "Wird auf Artikelebene gesetzt",
    [GranularityLevel.ITEM]: "Wird auf Modelebene gesetzt",
  };

  const getValueForOtherGranularityLevel = () => {
    return VALUE_FOR_OTHER_GRANULARITY_LEVEL[granularityLevel.value];
  };

  const getDataOfSection = (sectionId: string): DataValues[] => {
    return (
      productPassport.value?.dataSections.find((s) => s.id === sectionId)
        ?.dataValues ?? []
    );
  };

  const findSubSections = (sectionId: string | undefined): DataSectionDto[] => {
    return (
      productPassport.value?.dataSections.filter(
        (s) => s.parentId === sectionId,
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
    return productPassport.value?.dataSections.find((s) => s.id === sectionId);
  };

  const getFormSchema = (section: SectionDto): FormKitSchemaObject[] => {
    const children = [];
    for (const dataField of section.dataFields) {
      if (dataField.granularityLevel !== granularityLevel.value) {
        children.push({
          $cmp: "FakeField",
          props: {
            dataCy: dataField.id,
            placeholder: getValueForOtherGranularityLevel(),
            label: dataField!.name,
            options: dataField.options,
          },
        });
      } else {
        children.push({
          $cmp: dataField.type,
          props: {
            id: dataField.id,
            name: dataField.id,
            label: dataField!.name,
            validation: "required",
            options: dataField.options,
            dataCy: dataField.id,
          },
        });
      }
    }

    return [
      {
        $el: "div",
        attrs: {
          class: `grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 items-center`,
        },
        children: children,
      },
    ];
  };

  const generateDataValues = (sectionId: string): DataValueDto[] => {
    const section = productPassport.value?.dataSections.find(
      (s) => s.id === sectionId,
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
      ...section.dataFields.map((f) => ({
        value: undefined,
        dataSectionId: section?.id,
        dataFieldId: f.id,
        row: maxRow === undefined ? 0 : maxRow + 1,
      })),
    );
    return dataValuesToCreate;
  };

  const addRowToSection = async (sectionId: string) => {
    if (modelId.value && uniqueProductIdentifier.value) {
      const dataValuesToCreate = generateDataValues(sectionId);
      if (granularityLevel.value === GranularityLevel.MODEL)
        await apiClient.dpp.models.addData(
          uniqueProductIdentifier.value.referenceId,
          dataValuesToCreate,
        );
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

  const fetchProductPassport = async () => {
    if (uniqueProductIdentifier.value) {
      const response = await apiClient.dpp.productPassports.getById(
        uniqueProductIdentifier.value.uuid,
      );
      productPassport.value = response.data;
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
      } else {
        await apiClient.dpp.items.modifyData(
          modelId.value,
          uniqueProductIdentifier.value.referenceId,
          dataValueModifications,
        );
      }
      await fetchProductPassport();
    }
  };

  return {
    getUUID,
    granularityLevel,
    productPassport,
    fetchInFlight,
    getValueForOtherGranularityLevel,
    fetchModel,
    fetchItem,
    findSubSections,
    findSectionById,
    updateDataValues,
    addRowToSection,
    getFormData,
    getFormSchema,
  };
});
