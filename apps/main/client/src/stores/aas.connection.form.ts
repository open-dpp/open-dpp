import { defineStore } from "pinia";
import { ref } from "vue";
import apiClient from "../lib/api-client";
import { groupBy } from "lodash";
import {
  AasConnectionDto,
  AasPropertyDto,
  GranularityLevel,
  ModelDto,
  SectionType,
  TemplateDto,
} from "@open-dpp/api-client";
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

function aasFieldId(index: number) {
  return `aas-${index}`;
}

function dppFieldId(index: number) {
  return `dpp-${index}`;
}

interface FieldAssignmentRow {
  rowIndex: number;
}

function isFieldAssignmentRow(item: unknown): item is FieldAssignmentRow {
  return (
    typeof item === "object" &&
    item !== null &&
    "rowIndex" in item &&
    typeof item.rowIndex === "number"
  );
}

export const useAasConnectionFormStore = defineStore(
  "aas-connection-form",
  () => {
    const formData = ref<Record<string, string>>({});
    const formSchema = ref();
    const errorHandlingStore = useErrorHandlingStore();
    const granularityLevel = GranularityLevel.ITEM;
    const fetchInFlight = ref<boolean>(false);
    const lastRowIndex = ref<number>(0);

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

    const horizontalLine = () => {
      return {
        $el: "div",
        attrs: {
          class: "w-full border-t border-gray-300 m-2",
        },
      };
    };

    const newFieldAssignmentRow = (index: number) => {
      return {
        $el: "div",
        rowIndex: index,
        attrs: {
          class: "flex flex-col md:flex-row justify-around gap-2 items-center",
        },
        children: [
          {
            $el: "div",
            attrs: {
              class: "flex",
            },
            children: [
              {
                $formkit: "select",
                required: true,
                label: `Feld aus der Asset Administration Shell`,
                name: aasFieldId(index),
                placeholder:
                  "Wählen Sie ein Feld aus der Asset Administration Shell",
                options: aasProperties.value,
                "data-cy": `aas-select-${index}`,
              },
            ],
          },
          {
            $el: "div",
            children: "ist verknüpft mit",
            attrs: {
              class: "flex",
            },
          },
          {
            $el: "div",
            attrs: {
              class: "flex",
            },
            children: [
              {
                $formkit: "select",
                required: true,
                label: `Feld aus dem Produktdatenmodell`,
                placeholder: "Wählen Sie ein Feld aus dem Produktdatenmodell", // Add this line
                name: dppFieldId(index),
                options: templateOptions.value,
                "data-cy": `dpp-select-${index}`,
              },
            ],
          },
        ],
      };
    };

    const initializeFormSchema = () => {
      if (aasConnection.value) {
        formSchema.value = [];
        for (const [index] of aasConnection.value.fieldAssignments.entries()) {
          lastRowIndex.value = index;
          formSchema.value.push(newFieldAssignmentRow(index));
          if (index !== aasConnection.value.fieldAssignments.length - 1) {
            formSchema.value.push(horizontalLine());
          }
        }
      }
    };

    const initializeFormData = () => {
      if (!aasConnection.value) {
        return {};
      }
      formData.value = Object.fromEntries(
        aasConnection.value.fieldAssignments
          .map((fm, index) => [
            [aasFieldId(index), aasDropdownValue(fm.idShortParent, fm.idShort)],
            [
              dppFieldId(index),
              dataFieldDropdownValue(fm.sectionId, fm.dataFieldId),
            ],
          ])
          .flat(),
      );
      return formData;
    };

    const addFieldAssignmentRow = () => {
      const newIndex = lastRowIndex.value + 1;
      if (lastRowIndex.value > 0) {
        formSchema.value.push(horizontalLine());
      }
      formSchema.value.push(newFieldAssignmentRow(newIndex));
      lastRowIndex.value = newIndex;
      return formSchema.value;
    };

    const submitModifications = async () => {
      try {
        if (aasConnection.value) {
          const fieldAssignments = Object.entries(formData.value)
            .map(([key, value]) => {
              const [source, keyIndex] = key.split("-");
              if (source === "aas") {
                const ddpField = formData.value[`dpp-${keyIndex}`];
                if (!ddpField) {
                  return undefined;
                }
                const aasValues = aasDropdownValueToAasId(value);
                const dppValues = dataFieldDropdownValueToDppId(ddpField);
                return {
                  dataFieldId: dppValues.dataFieldId,
                  sectionId: dppValues.sectionId,
                  idShortParent: aasValues.parentIdShort,
                  idShort: aasValues.idShort,
                };
              } else {
                return undefined;
              }
            })
            .filter((a) => a !== undefined);

          const response = await apiClient.dpp.aasIntegration.modifyConnection(
            aasConnection.value.id,
            {
              name: aasConnection.value.name,
              modelId: aasConnection.value.modelId,
              fieldAssignments,
            },
          );
          aasConnection.value = response.data;
        }
      } catch (e) {
        errorHandlingStore.logErrorWithNotification(
          "Speichern der Verbindung fehlgeschlagen",
          e,
        );
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
          formSchema.value = formSchema.value.map((schemaItem: unknown) => {
            return isFieldAssignmentRow(schemaItem)
              ? newFieldAssignmentRow(schemaItem.rowIndex)
              : schemaItem;
          });
          formData.value = Object.fromEntries(
            Object.entries(formData.value).map(([key, value]) => {
              if (key.startsWith("dpp") && value) {
                const { sectionId, dataFieldId } =
                  dataFieldDropdownValueToDppId(value);
                const foundValue = template.sections
                  .find((s) => s.id === sectionId)
                  ?.dataFields.find((f) => f.id === dataFieldId);
                if (!foundValue) {
                  return [key, ""];
                }
              }
              return [key, value];
            }),
          );
        }
      } catch (e) {
        errorHandlingStore.logErrorWithNotification(
          "Wechsel des Modellpasses fehlgeschlagen",
          e,
        );
      }
    };

    const updateTemplateOptions = async (templateDto: TemplateDto) => {
      if (aasConnection.value) {
        templateOptions.value = templateDto.sections
          .filter(
            (s) =>
              (s.granularityLevel === granularityLevel ||
                !s.granularityLevel) &&
              s.type === SectionType.GROUP,
          )
          .map((section) => ({
            group: section.name,
            options: section.dataFields
              .filter((d) => d.granularityLevel === granularityLevel)
              .map((field) => ({
                label: field.name,
                value: dataFieldDropdownValue(section.id, field.id),
              })),
          }));
      }
    };

    const fetchConnection = async (id: string) => {
      fetchInFlight.value = true;
      const response = await apiClient.dpp.aasIntegration.getConnection(id);
      aasConnection.value = response.data;

      if (aasConnection.value) {
        const propertiesResponse =
          await apiClient.dpp.aasIntegration.getPropertiesOfAas(
            aasConnection.value.aasType,
          );
        const properties = propertiesResponse.data;
        aasProperties.value = Object.entries(
          groupBy(properties, "parentIdShort"),
        ).map(([parentIdShort, props]) => ({
          group: parentIdShort,
          options: props.map((prop) => ({
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
      initializeFormSchema();
      fetchInFlight.value = false;
    };

    return {
      aasConnection,
      fetchConnection,
      fetchInFlight,
      submitModifications,
      addFieldAssignmentRow,
      formData,
      formSchema,
      switchModel,
    };
  },
);
