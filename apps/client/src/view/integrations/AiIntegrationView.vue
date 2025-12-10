<script lang="ts" setup>
import { AiProvider } from "@open-dpp/api-client";
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useAiIntegrationStore } from "../../stores/ai.integration";

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

async function onSubmit() {
  if (formData.value) {
    await aiIntegrationStore.modifyConfiguration({
      isEnabled: formData.value.isEnabled,
      model: aiIntegrationStore.configuration?.model ?? "codestral-latest",
      provider:
        aiIntegrationStore.configuration?.provider ?? AiProvider.Mistral,
    });
  }
}
</script>

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
      <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
        <div class="flex items-center gap-2">
          <Checkbox
            v-model="formData.isEnabled"
            binary
            input-id="isEnabled"
            data-cy="toggle-integration"
          />
          <label for="isEnabled" class="cursor-pointer text-sm font-medium text-gray-700">
            {{ t('integrations.ai.activate') }}
          </label>
        </div>
        <div class="mt-2">
          <Button :label="t('common.save')" type="submit" />
        </div>
      </form>
    </div>
  </div>
</template>
