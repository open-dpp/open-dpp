<template>
  <div class="flex flex-col gap-3 p-3">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-base font-semibold text-gray-900">
          {{ t('integrations.ai.configuration') }}
        </h1>
        <p class="mt-2 text-sm text-gray-700">
          {{ t('integrations.ai.configurationDesc') }}
        </p>
      </div>
    </div>
    <div>
      <form-kit
        v-model="formData"
        :actions="false"
        type="form"
        @submit="onSubmit"
      >
        <FormKit
          data-cy="toggle-integration"
          type="checkbox"
          :label="t('integrations.ai.activate')"
          name="isEnabled"
        />
        <form-kit :label="t('common.save')" type="submit" />
      </form-kit>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { useAiIntegrationStore } from '../../stores/ai.integration';
import { AiProvider } from '@open-dpp/api-client';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const aiIntegrationStore = useAiIntegrationStore();
const formData = ref<{ isEnabled: boolean }>({ isEnabled: false });

watch(
  [() => aiIntegrationStore.configuration?.isEnabled], // The store property to watch
  async () => {
    if (!aiIntegrationStore.configuration) {
      await aiIntegrationStore.fetchConfiguration();
    }
    formData.value = {
      isEnabled: aiIntegrationStore.configuration?.isEnabled ?? false,
    };
  },
  { immediate: true }, // Optional: to run the watcher immediately when the component mounts
);

const onSubmit = async () => {
  if (formData.value) {
    await aiIntegrationStore.modifyConfiguration({
      isEnabled: formData.value.isEnabled,
      model: aiIntegrationStore.configuration?.model ?? 'codestral-latest',
      provider:
        aiIntegrationStore.configuration?.provider ?? AiProvider.Mistral,
    });
  }
};
</script>
