<template>
  <div class="">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-base font-semibold text-gray-900">Modellpass</h1>
        <p class="mt-2 text-sm text-gray-700">
          Erstellen Sie einen neuen Modellpass.
        </p>
      </div>
    </div>
    <div class="mt-8 flex flex-col gap-10">
      <div class="flex items-center">
        <div class="flex-auto">
          <form-kit
            v-model="name"
            data-cy="name"
            help="Geben Sie Ihrem Modellpass einen Namen"
            label="Name"
            name="name"
            type="text"
            validation="required"
          />
        </div>
        <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            class="block rounded-md bg-indigo-600 px-3 py-1.5 text-center text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 hover:cursor-pointer"
            type="button"
            @click="onSubmit"
          >
            Modelpass erstellen
          </button>
        </div>
      </div>
      <div>
        <ModelTemplateList
          :is-marketplace-selected="isMarketplaceSelected"
          :selected="selectedTemplate ? [selectedTemplate] : []"
          :show-tabs="true"
          @update-selected-items="
            (items) => (selectedTemplate = items[0] ? items[0] : null)
          "
          @update-is-marketplace-selected="
            (isSelected) => (isMarketplaceSelected = isSelected)
          "
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import apiClient from '../../lib/api-client';
import { useRouter } from 'vue-router';
import ModelTemplateList from '../../components/models/ModelTemplateList.vue';
import { useNotificationStore } from '../../stores/notification';
import { TemplateGetAllDto } from '@open-dpp/api-client';

const router = useRouter();
const notificationStore = useNotificationStore();

const props = defineProps<{
  organizationId: string;
}>();

const name = ref<string>('');
const selectedTemplate = ref<TemplateGetAllDto | null>(null);
const isMarketplaceSelected = ref<boolean>(false);

const onSubmit = async () => {
  if (!name.value) {
    notificationStore.addErrorNotification('Bitte geben Sie einen Namen ein.');
    return;
  }
  if (!selectedTemplate.value) {
    notificationStore.addErrorNotification(
      'Bitte wählen Sie eine Vorlage aus.',
    );
    return;
  }

  const response = await apiClient.dpp.models.create({
    name: name.value,
    templateId: isMarketplaceSelected.value
      ? undefined
      : selectedTemplate.value.id,
    marketplaceResourceId: isMarketplaceSelected.value
      ? selectedTemplate.value.id
      : undefined,
  });

  await router.push(
    `/organizations/${props.organizationId}/models/${response.data.id}`,
  );
};
</script>
