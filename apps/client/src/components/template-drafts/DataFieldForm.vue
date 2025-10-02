<script lang="ts" setup>
import type {
  DataFieldDto,
} from "@open-dpp/api-client";
import {
  DataFieldType,
  GranularityLevel,
} from "@open-dpp/api-client";
import { ref, watch } from "vue";
import { z } from "zod/v4";
import { useDraftStore } from "../../stores/draft";
import { useDraftSidebarStore } from "../../stores/draftSidebar";
import { useModelDialogStore } from "../../stores/modal.dialog";
import { useNotificationStore } from "../../stores/notification";
import BaseButton from "../BaseButton.vue";

const props = defineProps<{
  type: DataFieldType;
  parentId?: string;
  parentGranularityLevel?: GranularityLevel;
  id?: string;
}>();

const formData = ref<Record<string, unknown>>({});
const formSchema = ref();
const dataFieldToModify = ref<DataFieldDto | undefined>();
const draftStore = useDraftStore();
const draftSidebarStore = useDraftSidebarStore();
const modelDialogStore = useModelDialogStore();

function formSchemaFromType(type: DataFieldType, existingGranularityLevel: GranularityLevel | undefined) {
  const granularityOptions = {
    [GranularityLevel.MODEL]: "Produktmodellebene",
    [GranularityLevel.ITEM]: "Artikelebene",
  };
  const dataFieldFormkitSchema = [];

  switch (type) {
    case DataFieldType.TEXT_FIELD:
      dataFieldFormkitSchema.push({
        "$formkit": "text",
        "name": "name",
        "label": "Name des Textfeldes",
        "data-cy": "name",
      });
      break;
    case DataFieldType.PRODUCT_PASSPORT_LINK:
      dataFieldFormkitSchema.push({
        "$formkit": "text",
        "name": "name",
        "label": "Name der Produktpass Verlinkung",
        "data-cy": "name",
      });
      break;
    case DataFieldType.NUMERIC_FIELD:
      dataFieldFormkitSchema.push({
        "$formkit": "text",
        "name": "name",
        "label": "Name des numerischen Feldes",
        "data-cy": "name",
      });
      dataFieldFormkitSchema.push({
        "$formkit": "number",
        "name": "min",
        "label": "Minimum",
        "data-cy": "min",
      });
      dataFieldFormkitSchema.push({
        "$formkit": "number",
        "name": "max",
        "label": "Maximum",
        "data-cy": "max",
      });
      break;
    case DataFieldType.FILE_FIELD:
      dataFieldFormkitSchema.push({
        "$formkit": "text",
        "name": "name",
        "label": "Name des Dateifeldes",
        "data-cy": "name",
      });
      break;
    default:
      console.warn(
        `[DataFieldForm] Unsupported node type: ${type as string}, using generic form. Please implement a form schema for this type.`,
      );
  }
  if (!existingGranularityLevel) {
    dataFieldFormkitSchema.push({
      "$formkit": "select",
      "name": "granularityLevel",
      "label": "Granularitätsebene",
      "options": granularityOptions,
      "data-cy": "select-granularity-level",
    });
  }
  return dataFieldFormkitSchema;
}

watch(
  [() => props.type, () => props.id], // The store property to watch
  ([newType, newId]) => {
    const dataField = newId ? draftStore.findDataField(newId) : undefined;
    formSchema.value = formSchemaFromType(
      newType,
      dataField?.granularityLevel ?? props.parentGranularityLevel,
    );
    if (dataField) {
      dataFieldToModify.value = dataField;
      if (dataField.type === DataFieldType.NUMERIC_FIELD) {
        formData.value = {
          name: dataField.name,
          granularityLevel: dataField.granularityLevel,
          min: dataField.options?.min,
          max: dataField.options?.max,
        };
      }
      else {
        formData.value = {
          name: dataFieldToModify.value.name,
          granularityLevel: dataFieldToModify.value.granularityLevel,
        };
      }
    }
  },
  { immediate: true }, // Optional: to run the watcher immediately when the component mounts
);

async function onDelete() {
  modelDialogStore.open(
    {
      title: "Datenfeld löschen",
      description: "Sind Sie sicher, dass Sie dieses Datenfeld löschen wollen?",
      type: "warning",
    },
    async () => {
      if (dataFieldToModify.value) {
        await draftStore.deleteDataField(dataFieldToModify.value.id);
        draftSidebarStore.close();
      }
    },
  );
}

async function onSubmit() {
  let options: Record<string, unknown> | undefined;
  if (props.type === DataFieldType.NUMERIC_FIELD) {
    options = {
      min: Number(formData.value.min),
      max: Number(formData.value.max),
    };
  }
  const data = z
    .object({
      name: z.string(),
      granularityLevel: z.enum(GranularityLevel),
      options: z.any().optional(),
    })
    .parse({
      granularityLevel:
        formData.value.granularityLevel
        || dataFieldToModify.value?.granularityLevel
        || props.parentGranularityLevel,
      name: formData.value.name,
      options,
    });
  if (dataFieldToModify.value) {
    await draftStore.modifyDataField(dataFieldToModify.value.id, {
      name: data.name,
      options: data.options ?? undefined,
    });
  }
  else if (props.parentId) {
    await draftStore.addDataField(props.parentId, {
      type: props.type,
      name: data.name,
      granularityLevel: data.granularityLevel,
      options: data.options ?? undefined,
    });
  }
  else {
    const notificationStore = useNotificationStore();
    notificationStore.addErrorNotification(
      "Datenfeld konnte nicht hinzugefügt werden.",
    );
  }

  draftSidebarStore.close();
}
</script>

<template>
  <div class="p-4">
    <FormKit
      id="repeatable-form"
      v-model="formData"
      :actions="false"
      type="form"
      @submit="onSubmit"
    >
      <FormKitSchema v-if="formSchema" :schema="formSchema" />
      <div class="flex gap-1">
        <BaseButton data-cy="submit" type="submit" variant="primary">
          {{ dataFieldToModify ? 'Ändern' : 'Hinzufügen' }}
        </BaseButton>
        <BaseButton
          v-if="dataFieldToModify"
          data-cy="delete"
          type="button"
          variant="error"
          @click="onDelete"
        >
          Datenfeld löschen
        </BaseButton>
      </div>
    </FormKit>
  </div>
</template>
