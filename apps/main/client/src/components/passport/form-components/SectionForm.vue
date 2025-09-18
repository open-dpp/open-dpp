<template>
  <FormKit v-model="formData" :actions="false" type="form" @submit="onSubmit">
    <FormKitSchema
      v-if="formSchema"
      :library="{
        TextField,
        ProductPassportLink,
        FakeField,
        NumericField,
        FileField,
      }"
      :schema="formSchema"
    />
    <FormKit label="Speichern" type="submit" />
  </FormKit>
  <h3
    v-if="passportFormStore.findSubSections(section.id).length > 0"
    class="text-base/7 font-semibold text-gray-900"
  >
    Weiterführende Abschnitte
  </h3>
  <div class="flex">
    <BaseButton
      v-for="subSection in passportFormStore.findSubSections(section.id)"
      :key="subSection.id"
      :data-cy="`edit-subsection-${subSection.id}`"
      variant="primary"
      @click="onEditSubsection(subSection.id)"
      ><div class="flex items-center gap-2">
        <FolderIcon aria-hidden="true" class="size-5 shrink-0 text-white" />
        <div class="text-sm/6 font-medium text-white">
          {{ subSection.name }}
        </div>
      </div>
    </BaseButton>
  </div>
</template>

<script lang="ts" setup>
import { DataSectionDto } from '@open-dpp/api-client';
import { ref, watch } from 'vue';
import TextField from './TextField.vue';
import FakeField from './FakeField.vue';
import ProductPassportLink from './ProductPassportLink.vue';
import {
  DataValues,
  usePassportFormStore,
} from '../../../stores/passport.form';
import NumericField from './NumericField.vue';
import FileField from './FileField.vue';
import { useNotificationStore } from '../../../stores/notification';
import { useErrorHandlingStore } from '../../../stores/error.handling';
import BaseButton from '../../BaseButton.vue';
import { useRouter } from 'vue-router';
import { FolderIcon } from '@heroicons/vue/24/outline';

const props = defineProps<{
  section: DataSectionDto;
  row: number;
}>();

const passportFormStore = usePassportFormStore();
const router = useRouter();

const notificationStore = useNotificationStore();
const errorHandlingStore = useErrorHandlingStore();

const formData = ref<DataValues>({});
const formSchema = ref();

watch(
  [
    () => props.section,
    () => passportFormStore.productPassport?.id,
    () => props.row,
  ], // The store property to watch
  () => {
    formSchema.value = passportFormStore.getFormSchema(props.section);
    formData.value = passportFormStore.getFormData(
      props.section.id,
      formData.value,
      props.row,
    );
  },
  { immediate: true }, // Optional: to run the watcher immediately when the component mounts
);

const onEditSubsection = (subSectionId: string) => {
  router.push(`?sectionId=${subSectionId}&row=${props.row}`);
};

const onSubmit = async () => {
  try {
    await passportFormStore.updateDataValues(
      props.section.id,
      formData.value,
      props.row,
    );
    notificationStore.addSuccessNotification('Daten erfolgreich gespeichert');
  } catch (e) {
    errorHandlingStore.logErrorWithNotification(
      'Daten konnten nicht gespeichert werden',
      e,
    );
  }
};
</script>
