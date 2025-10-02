<script lang="ts" setup>
import { onMounted } from "vue";
import CreateConnectionForm from "../../components/integrations/CreateConnectionForm.vue";
import { useIndexStore } from "../../stores";
import { useModelsStore } from "../../stores/models";

const modelsStore = useModelsStore();
const indexStore = useIndexStore();

onMounted(async () => {
  await modelsStore.getModels();
});
</script>

<template>
  <div class="flex flex-col gap-3 p-3">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-base font-semibold text-gray-900">
          Verbindung
        </h1>
        <p class="mt-2 text-sm text-gray-700">
          Erstellen Sie eine neue Verbindung.
        </p>
      </div>
    </div>
    <div>
      <CreateConnectionForm
        v-if="modelsStore.models && modelsStore.models.length > 0"
      />
      <div
        v-if="modelsStore.models && modelsStore.models.length === 0"
        class="text-gray-500 p-4"
      >
        Kein Modellpass vorhanden, für den Artikelpässe automatisiert über eine
        Verbindung erstellt werden können. Bitte
        <router-link
          :to="`/organizations/${indexStore.selectedOrganization}/models`"
          class="text-blue-600 hover:text-blue-800 underline"
        >
          erstellen Sie zuerst einen Modellpass.
        </router-link>
      </div>
    </div>
  </div>
</template>
