<script lang="ts" setup>
import { Button, Dialog, InputGroup, InputText } from "primevue";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { authClient } from "../../auth-client.ts";
import SimpleTable from "../../components/lists/SimpleTable.vue";
import { AI_INTEGRATION_ID, PRO_ALPHA_INTEGRATION_ID } from "../../const";
import { useIndexStore } from "../../stores";
import { useAiIntegrationStore } from "../../stores/ai.integration";
import { useNotificationStore } from "../../stores/notification";

const indexStore = useIndexStore();
const notificationStore = useNotificationStore();
const aiIntegrationStore = useAiIntegrationStore();

const { t } = useI18n();
const apiKey = ref<string>("");

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
  const { data, error } = await authClient.apiKey.create({
    name: "project-api-key",
    expiresIn: 60 * 60 * 24 * 28,
    prefix: "project-api-key",
  });
  if (error) {
    notificationStore.addErrorNotification(
      t("integrations.apiKey.createError"),
    );
    return;
  }
  apiKey.value = data.key;
}

function copyApiKeyToClipboard() {
  navigator.clipboard.writeText(apiKey.value);
}

onMounted(async () => {
  await aiIntegrationStore.fetchConfiguration();
});
</script>

<template>
  <div class="flex flex-col gap-3 p-3">
    <Dialog :visible="apiKey.length > 0" modal header="API Key" :style="{ width: '75rem' }">
      <span class="text-surface-500 dark:text-surface-400 block mb-8">{{ t('integrations.apiKey.createSuccess') }}</span>
      <div class="flex items-center gap-4 mb-4">
        <InputGroup>
          <Button :label="t('common.copy')" @click="copyApiKeyToClipboard" />
          <InputText placeholder="API-Key" :readonly="true" :value="apiKey" />
        </InputGroup>
      </div>
      <div class="flex justify-end gap-2">
        <Button type="button" :label="t('common.close')" severity="secondary" @click="apiKey = ''" />
      </div>
    </Dialog>
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
