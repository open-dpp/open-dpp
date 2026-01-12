<script lang="ts" setup>
import type { DataSectionDto } from "@open-dpp/api-client";
import type {
  DataValues,
} from "../../../stores/passport.form";
import { FolderIcon } from "@heroicons/vue/24/outline";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useErrorHandlingStore } from "../../../stores/error.handling";
import { useNotificationStore } from "../../../stores/notification";
import {
  usePassportFormStore,
} from "../../../stores/passport.form";
import BaseButton from "../../basics/BaseButton.vue";
import FakeField from "./FakeField.vue";
import FileField from "./FileField.vue";
import NumericField from "./NumericField.vue";
import ProductPassportLink from "./ProductPassportLink.vue";
import TextField from "./TextField.vue";

const props = defineProps<{
  section: DataSectionDto;
  row: number;
}>();

const { t } = useI18n();
const passportFormStore = usePassportFormStore();
const router = useRouter();

const notificationStore = useNotificationStore();
const errorHandlingStore = useErrorHandlingStore();

const formData = ref<DataValues>({});

const componentMap: Record<string, any> = {
  TextField,
  NumericField,
  FileField,
  ProductPassportLink,
};

const fields = computed(() => {
  return props.section.dataFields.map((dataField) => {
    if (dataField.granularityLevel !== passportFormStore.granularityLevel) {
      return {
        id: dataField.id,
        component: FakeField,
        props: {
          dataCy: dataField.id,
          placeholder: passportFormStore.getValueForOtherGranularityLevel(),
          label: dataField.name,
          className: "w-full",
        },
      };
    }
    else {
      const comp = componentMap[dataField.type] || TextField;
      return {
        id: dataField.id,
        component: comp,
        props: {
          id: dataField.id,
          label: dataField.name,
          required: true,
          options: dataField.options,
          dataCy: dataField.id,
          className: "w-full",
        },
      };
    }
  });
});

watch(
  [
    () => props.section,
    () => passportFormStore.productPassport?.id,
    () => props.row,
  ], // The store property to watch
  () => {
    formData.value = passportFormStore.getFormData(
      props.section.id,
      formData.value,
      props.row,
    );
  },
  { immediate: true }, // Optional: to run the watcher immediately when the component mounts
);

function onEditSubsection(subSectionId: string) {
  router.push(`?sectionId=${subSectionId}&row=${props.row}`);
}

async function onSubmit() {
  try {
    await passportFormStore.updateDataValues(
      props.section.id,
      formData.value,
      props.row,
    );
    notificationStore.addSuccessNotification(
      t("models.form.section.saveSuccess"),
    );
  }
  catch (e) {
    errorHandlingStore.logErrorWithNotification(
      t("models.form.section.saveError"),
      e,
    );
  }
}
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
      <component
        :is="field.component"
        v-for="field in fields"
        :key="field.id"
        v-model="formData[field.id]"
        v-bind="field.props"
      />
    </div>
    <div class="flex justify-start">
      <BaseButton type="submit" variant="primary">
        {{ t('common.save') }}
      </BaseButton>
    </div>
  </form>
  <h3
    v-if="passportFormStore.findSubSections(section.id).length > 0"
    class="text-base/7 font-semibold text-gray-900"
  >
    {{ t('models.form.section.additional') }}
  </h3>
  <div class="flex">
    <BaseButton
      v-for="subSection in passportFormStore.findSubSections(section.id)"
      :key="subSection.id"
      :data-cy="`edit-subsection-${subSection.id}`"
      variant="primary"
      @click="onEditSubsection(subSection.id)"
    >
      <div class="flex items-center gap-2">
        <FolderIcon aria-hidden="true" class="size-5 shrink-0 text-white" />
        <div class="text-sm/6 font-medium text-white">
          {{ subSection.name }}
        </div>
      </div>
    </BaseButton>
  </div>
</template>
