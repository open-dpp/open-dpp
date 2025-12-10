<script lang="ts" setup>
import type { DataFieldDto } from "@open-dpp/api-client";
import { DataFieldType, GranularityLevel } from "@open-dpp/api-client";
import Button from "primevue/button";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import SplitButton from "primevue/splitbutton";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { z } from "zod/v4";
import { APPEND_TO } from "../../const.ts";
import { useDraftStore } from "../../stores/draft";
import { SidebarContentType, useDraftSidebarStore } from "../../stores/draftSidebar";
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
const formData = ref<{
  name: string;
  granularityLevel?: GranularityLevel;
  min?: number;
  max?: number;
}>({
  name: "",
});
const dataFieldToModify = ref<DataFieldDto | undefined>();
const draftStore = useDraftStore();
const draftSidebarStore = useDraftSidebarStore();
const modelDialogStore = useModelDialogStore();

const granularityOptions = computed(() => [
  { label: t("builder.granularity.model"), value: GranularityLevel.MODEL },
  { label: t("builder.granularity.item"), value: GranularityLevel.ITEM },
]);

const fieldLabel = computed(() => {
  switch (props.type) {
    case DataFieldType.TEXT_FIELD:
      return t("builder.textField.name");
    case DataFieldType.PRODUCT_PASSPORT_LINK:
      return t("builder.passportLink.name");
    case DataFieldType.NUMERIC_FIELD:
      return t("builder.numeric.name");
    case DataFieldType.FILE_FIELD:
      return t("builder.file.name");
    default:
      return "Name";
  }
});

watch(
  [() => props.type, () => props.id],
  ([_, newId]) => {
    const dataField = newId ? draftStore.findDataField(newId) : undefined;

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
          name: dataField.name,
          granularityLevel: dataField.granularityLevel,
        };
      }
    }
    else {
      dataFieldToModify.value = undefined;
      formData.value = { name: "" };
    }
  },
  { immediate: true },
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

  // Basic validation handling (can be improved)
  if (!formData.value.name) {
    return; // Or show error
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
  formRef.value?.requestSubmit();
}

const buttonActions = [
  {
    label: t("draft.changeDataFieldType"),
    command: onChangeDataFieldType,
  },
];
</script>

<template>
  <form ref="formRef" class="flex flex-col gap-4 p-4" @submit.prevent="onSubmit">
    <div class="flex flex-col gap-2">
      <label for="name" class="block text-sm font-medium text-gray-700">
        {{ fieldLabel }}
      </label>
      <InputText
        id="name"
        v-model="formData.name"
        type="text"
        required
        class="w-full"
        data-cy="name"
      />
    </div>

    <template v-if="type === DataFieldType.NUMERIC_FIELD">
      <div class="flex flex-col gap-2">
        <label for="min" class="block text-sm font-medium text-gray-700">
          {{ t("builder.numeric.min") }}
        </label>
        <InputNumber
          id="min"
          v-model="formData.min"
          class="w-full"
          data-cy="min"
        />
      </div>
      <div class="flex flex-col gap-2">
        <label for="max" class="block text-sm font-medium text-gray-700">
          {{ t("builder.numeric.max") }}
        </label>
        <InputNumber
          id="max"
          v-model="formData.max"
          class="w-full"
          data-cy="max"
        />
      </div>
    </template>

    <div v-if="!dataFieldToModify?.granularityLevel && !parentGranularityLevel" class="flex flex-col gap-2">
      <label for="granularityLevel" class="block text-sm font-medium text-gray-700">
        {{ t("builder.granularityLevel") }}
      </label>
      <Select
        id="granularityLevel"
        v-model="formData.granularityLevel"
        :options="granularityOptions"
        option-label="label"
        option-value="value"
        class="w-full"
        data-cy="select-granularity-level"
        placeholder="Select Granularity"
      />
    </div>

    <div class="flex justify-between mt-4">
      <Button
        v-if="dataFieldToModify"
        :label="t('common.delete')"
        severity="danger"
        type="button"
        @click="onDelete"
      />
      <!-- If not modifying, show placeholder or nothing on left? Style preserved from original -->
      <div v-else />

      <SplitButton
        :label="t('common.save')"
        :model="buttonActions"
        :pt="{
          menu: {
            id: APPEND_TO,
          },
        }"
        severity="primary"
        type="button"
        @click="submitForm"
      />
    </div>
  </form>
</template>
