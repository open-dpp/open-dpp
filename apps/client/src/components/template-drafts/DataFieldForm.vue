<script lang="ts" setup>
import type { DataFieldDto } from "@open-dpp/api-client";
import { DataFieldType, GranularityLevel } from "@open-dpp/api-client";
import { Button, SplitButton } from "primevue";
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { z } from "zod/v4";
import { APPEND_TO } from "../../const.ts";
import { useDraftStore } from "../../stores/draft";
import {
  SidebarContentType,
  useDraftSidebarStore,
} from "../../stores/draftSidebar";
import { useModelDialogStore } from "../../stores/modal.dialog";
import { useNotificationStore } from "../../stores/notification";

const props = defineProps<{
  type: DataFieldType;
  parentId?: string;
  parentGranularityLevel?: GranularityLevel;
  id?: string;
}>();
const { t } = useI18n();
const formRef = ref<HTMLFormElement | null>(null);
const formData = ref<Record<string, unknown>>({});
const formSchema = ref();
const dataFieldToModify = ref<DataFieldDto | undefined>();
const draftStore = useDraftStore();
const draftSidebarStore = useDraftSidebarStore();
const modelDialogStore = useModelDialogStore();

function formSchemaFromType(
  type: DataFieldType,
  existingGranularityLevel: GranularityLevel | undefined,
) {
  const granularityOptions = {
    [GranularityLevel.MODEL]: t("builder.granularity.model"),
    [GranularityLevel.ITEM]: t("builder.granularity.item"),
  };

  const dataFieldFormkitSchema = [];
  const nameField = {
    "$formkit": "text",
    "name": "name",
    "validation": "required",
    "data-cy": "name",
  };

  switch (type) {
    case DataFieldType.TEXT_FIELD:
      dataFieldFormkitSchema.push({
        ...nameField,
        label: t("builder.textField.name"),
      });
      break;
    case DataFieldType.PRODUCT_PASSPORT_LINK:
      dataFieldFormkitSchema.push({
        ...nameField,
        label: t("builder.passportLink.name"),
      });
      break;
    case DataFieldType.NUMERIC_FIELD:
      dataFieldFormkitSchema.push({
        ...nameField,
        label: t("builder.numeric.name"),
      });
      dataFieldFormkitSchema.push({
        "$formkit": "number",
        "name": "min",
        "label": t("builder.numeric.min"),
        "data-cy": "min",
      });
      dataFieldFormkitSchema.push({
        "$formkit": "number",
        "name": "max",
        "label": t("builder.numeric.max"),
        "data-cy": "max",
      });
      break;
    case DataFieldType.FILE_FIELD:
      dataFieldFormkitSchema.push({
        ...nameField,
        label: t("builder.file.name"),
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
      "label": t("builder.granularityLevel"),
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
      title: t("draft.deleteDataField"),
      description: t("draft.deleteDataFieldDescription"),
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
async function onChangeDataFieldType() {
  if (dataFieldToModify.value) {
    draftSidebarStore.setContentWithProps(
      SidebarContentType.DATA_FIELD_SELECTION,
      {
        type: dataFieldToModify.value?.type,
        parentId: props.parentId,
        parentGranularityLevel: props.parentGranularityLevel,
        dataFieldId: dataFieldToModify.value.id,
      },
    );
  }
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
      type: z.enum(DataFieldType),
      granularityLevel: z.enum(GranularityLevel),
      options: z.any().optional(),
    })
    .parse({
      granularityLevel:
        formData.value.granularityLevel
        || dataFieldToModify.value?.granularityLevel
        || props.parentGranularityLevel,
      name: formData.value.name,
      type: props.type,
      options,
    });
  if (dataFieldToModify.value) {
    await draftStore.modifyDataField(dataFieldToModify.value.id, {
      name: data.name,
      type: data.type,
      options: data.options ?? undefined,
    });
  }
  else if (props.parentId) {
    await draftStore.addDataField(props.parentId, {
      type: data.type,
      name: data.name,
      granularityLevel: data.granularityLevel,
      options: data.options ?? undefined,
    });
  }
  else {
    const notificationStore = useNotificationStore();
    notificationStore.addErrorNotification(t("draft.errorAddingDataField"));
  }
  draftSidebarStore.close();
}
async function submitForm() {
  formRef.value?.node.submit();
}

const buttonActions = [
  {
    label: "Update",
    command: onChangeDataFieldType,
  },
  {
    label: t("draft.deleteDataField"),
    command: onDelete,
  },
];
</script>

<template>
  <div class="p-4">
    <FormKit
      id="repeatable-form"
      ref="formRef"
      v-model="formData"
      :actions="false"
      type="form"
      @submit="onSubmit"
    >
      <FormKitSchema v-if="formSchema" :schema="formSchema" />
      <div class="flex gap-1">
        <SplitButton
          v-if="dataFieldToModify"
          data-cy="submit"
          :model="buttonActions"
          :append-to="APPEND_TO"
          @click="submitForm"
        >
          {{ t("common.change") }}
        </SplitButton>
        <Button v-else data-cy="submit" @click="submitForm">
          {{ t("common.add") }}
        </Button>
      </div>
    </FormKit>
  </div>
</template>
