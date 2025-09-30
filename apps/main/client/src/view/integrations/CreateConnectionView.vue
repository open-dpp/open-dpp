<template>
  <div class="flex flex-col gap-3 p-3">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-base font-semibold text-gray-900">
          {{ t('integrations.connections.label', 1) }}
        </h1>
        <p class="mt-2 text-sm text-gray-700">
          {{ t('integrations.connections.create') }}
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
        {{ t('integrations.connections.model.noModelFound') }}
        <router-link
          :to="`/organizations/${indexStore.selectedOrganization}/models`"
          class="text-blue-600 hover:text-blue-800 underline"
        >
          {{ t('integrations.connections.model.noModelFoundLink') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import { useModelsStore } from '../../stores/models';
import CreateConnectionForm from '../../components/integrations/CreateConnectionForm.vue';
import { useIndexStore } from '../../stores';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const modelsStore = useModelsStore();
const indexStore = useIndexStore();

onMounted(async () => {
  await modelsStore.getModels();
});
</script>
