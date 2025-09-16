<template>
  <div class="flex flex-col gap-3 p-3">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-base font-semibold text-gray-900">KI Konfiguration</h1>
        <p class="mt-2 text-sm text-gray-700">
          Konfigurieren Sie die KI-Integration
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
          label="KI-Integration aktivieren"
          name="isEnabled"
        />
        <form-kit label="Speichern" type="submit" />
      </form-kit>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";
import { useAiIntegrationStore } from "../../stores/ai.integration";
import { AiProvider } from "@open-dpp/api-client";

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
      model: aiIntegrationStore.configuration?.model ?? "codestral-latest",
      provider:
        aiIntegrationStore.configuration?.provider ?? AiProvider.Mistral,
    });
  }
};
</script>
