<script lang="ts" setup>
import type { TemplateGetAllDto } from "@open-dpp/api-client";
import InputText from "primevue/inputtext";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import ModelTemplateList from "../../components/models/ModelTemplateList.vue";
import apiClient from "../../lib/api-client";
import { useNotificationStore } from "../../stores/notification";

const props = defineProps<{
  organizationId: string;
}>();
const router = useRouter();
const notificationStore = useNotificationStore();
const { t } = useI18n();

const name = ref<string>("");
const selectedTemplate = ref<TemplateGetAllDto | null>(null);
const isMarketplaceSelected = ref<boolean>(false);
const errors = ref<{ name?: string }>({});

async function onSubmit() {
  errors.value = {};
  if (!name.value) {
    errors.value.name = t("validation.required");
    notificationStore.addErrorNotification(t("models.form.name.error"));
    return;
  }
  if (!selectedTemplate.value) {
    notificationStore.addErrorNotification(
      t("models.form.passportDraft.error"),
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
}
</script>

<template>
  <div class="">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-base font-semibold text-gray-900">
          {{ t('models.pass') }}
        </h1>
        <p class="mt-2 text-sm text-gray-700">
          {{ t('models.createPass') }}
        </p>
      </div>
    </div>
    <div class="mt-8 flex flex-col gap-10">
      <div class="flex items-start">
        <div class="flex-auto">
          <div class="flex flex-col gap-2">
            <label for="name" class="block text-sm font-medium text-gray-700">
              {{ t('models.form.name.label') }}
            </label>
            <InputText
              id="name"
              v-model="name"
              type="text"
              :invalid="!!errors.name"
              class="w-full"
              data-cy="name"
            />
            <small v-if="errors.name" class="text-red-600">{{ errors.name }}</small>
            <small v-else class="text-gray-500">{{ t('models.form.name.help') }}</small>
          </div>
        </div>
        <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            class="block rounded-md bg-indigo-600 px-3 py-1.5 text-center text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 hover:cursor-pointer"
            type="button"
            @click="onSubmit"
          >
            {{ t('models.submitCreatePass') }}
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
