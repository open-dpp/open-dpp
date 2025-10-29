<script lang="ts" setup>
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import SimpleTable from "../../components/lists/SimpleTable.vue";
import { AI_INTEGRATION_ID, PRO_ALPHA_INTEGRATION_ID } from "../../const";
import { useIndexStore } from "../../stores";
import { useAiIntegrationStore } from "../../stores/ai.integration";
import { useNotificationStore } from "../../stores/notification";

const indexStore = useIndexStore();
const notificationStore = useNotificationStore();
const aiIntegrationStore = useAiIntegrationStore();

const { t } = useI18n();

const rows = computed(() => [
  {
    name: t("integrations.proAlpha"),
    status: t("integrations.connections.status.active"),
    id: PRO_ALPHA_INTEGRATION_ID,
  },
  {
    name: t("integrations.ai.label"),
    status: aiIntegrationStore.configuration?.isEnabled
      ? t("integrations.connections.status.active")
      : t("integrations.connections.status.inactive"),
    id: AI_INTEGRATION_ID,
  },
]);

const actions = computed(() => [
  {
    name: t("common.edit"),
    actionLinkBuilder: (row: Record<string, string>) =>
      `/organizations/${indexStore.selectedOrganization}/integrations/${row.id}`,
  },
]);

async function createApiKey() {
  notificationStore.addErrorNotification(
    t("integrations.apiKey.createError"),
  );
}

onMounted(async () => {
  await aiIntegrationStore.fetchConfiguration();
});
</script>

<template>
  <div class="flex flex-col gap-3 p-3">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-base font-semibold text-gray-900">
          {{ t('integrations.integrations') }}
        </h1>
        <p class="mt-2 text-sm text-gray-700">
          {{ t('integrations.allIntegrations') }}
        </p>
      </div>
      <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
        <button
          class="block rounded-md bg-indigo-600 px-3 py-1.5 text-center text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          @click="createApiKey"
        >
          {{ t('integrations.apiKey.create') }}
        </button>
      </div>
    </div>
    <SimpleTable
      :headers="['Name', 'Status']"
      :ignore-row-keys="['id']"
      :row-actions="actions"
      :rows="rows"
    />
  </div>
</template>
