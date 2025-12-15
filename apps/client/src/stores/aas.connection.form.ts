import type {
  AasConnectionDto,
  AasFieldAssignmentDto,
  AasPropertyDto,
  ModelDto,
  TemplateDto,
} from "@open-dpp/api-client";
import {
  GranularityLevel,
  SectionType,
} from "@open-dpp/api-client";
import { groupBy } from "lodash";
import { defineStore } from "pinia";
import { ref } from "vue";
import apiClient from "../lib/api-client";
import { i18n } from "../translations/i18n.ts";
import { useErrorHandlingStore } from "./error.handling";

function aasDropdownValue(parentIdShort: string, idShort: string) {
  return [parentIdShort, idShort].join("/");
}

function aasDropdownValueToAasId(dropdownValue: string) {
  const [parentIdShort, idShort] = dropdownValue.split("/");
  return {
    parentIdShort,
    idShort,
  };
}

function dataFieldDropdownValue(sectionId: string, fieldId: string) {
  return [sectionId, fieldId].join("/");
}

function dataFieldDropdownValueToDppId(dropdownValue: string) {
  const [sectionId, dataFieldId] = dropdownValue.split("/");
  return {
    sectionId,
    dataFieldId,
  };
}

export const useAasConnectionFormStore = defineStore(
  "aas-connection-form",
  () => {
    const { t } = i18n.global;
    const fieldAssignments = ref<{ id: string; aas: string; dpp: string }[]>([]);
    const errorHandlingStore = useErrorHandlingStore();
    const granularityLevel = GranularityLevel.ITEM;
    const fetchInFlight = ref<boolean>(false);

    const aasConnection = ref<AasConnectionDto>();
    const aasProperties = ref<
      {
        group: string;
        options: {
          label: string;
          value: string;
          property: AasPropertyDto;
        }[];
      }[]
    >([]);

    const templateOptions = ref<
      {
        group: string;
        options: {
          label: string;
          value: string;
        }[];
      }[]
    >([]);

    const initializeFormData = () => {
      if (!aasConnection.value) {
        fieldAssignments.value = [];
        return;
      }
      fieldAssignments.value = aasConnection.value.fieldAssignments.map(fm => ({
        id: crypto.randomUUID(),
        aas: aasDropdownValue(fm.idShortParent, fm.idShort),
        dpp: dataFieldDropdownValue(fm.sectionId, fm.dataFieldId),
      }));
    };

    const addFieldAssignmentRow = () => {
      fieldAssignments.value.push({ id: crypto.randomUUID(), aas: "", dpp: "" });
    };

    const removeFieldAssignmentRow = (index: number) => {
      fieldAssignments.value.splice(index, 1);
    };

    const submitModifications = async () => {
      try {
        if (aasConnection.value) {
          const assignments = fieldAssignments.value
            .map(({ aas, dpp }) => {
              if (!aas || !dpp) {
                return undefined;
              }
              const aasValues = aasDropdownValueToAasId(aas);
              const dppValues = dataFieldDropdownValueToDppId(dpp);
              return {
                dataFieldId: dppValues.dataFieldId,
                sectionId: dppValues.sectionId,
                idShortParent: aasValues.parentIdShort,
                idShort: aasValues.idShort,
              };
            })
            .filter((item): item is AasFieldAssignmentDto => item !== undefined);

          const response = await apiClient.dpp.aasIntegration.modifyConnection(
            aasConnection.value.id,
            {
              name: aasConnection.value.name,
              modelId: aasConnection.value.modelId,
              fieldAssignments: assignments,
            },
          );
          aasConnection.value = response.data;
        }
      }
      catch (e) {
        errorHandlingStore.logErrorWithNotification(
          t("integrations.connections.errorSave"),
          e,
        );
      }
    };

    const updateTemplateOptions = async (templateDto: TemplateDto) => {
      if (aasConnection.value) {
        templateOptions.value = templateDto.sections
          .filter(
            s =>
              (s.granularityLevel === granularityLevel
                || !s.granularityLevel)
              && s.type === SectionType.GROUP,
          )
          .map(section => ({
            group: section.name,
            options: section.dataFields
              .filter(d => d.granularityLevel === granularityLevel)
              .map(field => ({
                label: field.name,
                value: dataFieldDropdownValue(section.id, field.id),
              })),
          }));
      }
    };

    const switchModel = async (model: ModelDto) => {
      try {
        if (aasConnection.value && model.templateId) {
          aasConnection.value.modelId = model.id;
          aasConnection.value.dataModelId = model.templateId;
          const response = await apiClient.dpp.templates.getById(
            aasConnection.value.dataModelId,
          );
          const template = response.data;
          await updateTemplateOptions(template);

          fieldAssignments.value = fieldAssignments.value.map((assignment) => {
            if (assignment.dpp) {
              const { sectionId, dataFieldId }
                = dataFieldDropdownValueToDppId(assignment.dpp);
              const foundValue = template.sections
                .find(s => s.id === sectionId)
                ?.dataFields
                .find(f => f.id === dataFieldId);
              if (!foundValue) {
                return { ...assignment, dpp: "" };
              }
            }
            return assignment;
          });
        }
      }
      catch (e) {
        errorHandlingStore.logErrorWithNotification(
          t("integrations.connections.errorSwitch"),
          e,
        );
      }
    };

    const fetchConnection = async (id: string) => {
      fetchInFlight.value = true;
      const response = await apiClient.dpp.aasIntegration.getConnection(id);
      aasConnection.value = response.data;

      if (aasConnection.value) {
        const propertiesResponse
          = await apiClient.dpp.aasIntegration.getPropertiesOfAas(
            aasConnection.value.aasType,
          );
        const properties = propertiesResponse.data;
        aasProperties.value = Object.entries(
          groupBy(properties, "parentIdShort"),
        ).map(([parentIdShort, props]) => ({
          group: parentIdShort,
          options: props.map(prop => ({
            label: prop.property.idShort,
            value: aasDropdownValue(parentIdShort, prop.property.idShort),
            property: prop.property,
          })),
        }));
        const templateResponse = await apiClient.dpp.templates.getById(
          aasConnection.value.dataModelId,
        );
        await updateTemplateOptions(templateResponse.data);
      }
      initializeFormData();
      fetchInFlight.value = false;
    };

    return {
      aasConnection,
      fetchConnection,
      fetchInFlight,
      submitModifications,
      addFieldAssignmentRow,
      removeFieldAssignmentRow,
      fieldAssignments,
      aasProperties,
      templateOptions,
      switchModel,
    };
  },
);
