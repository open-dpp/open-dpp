<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { authClient } from "../../auth-client.ts";
import { AI_INTEGRATION_ID } from "../../const";
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
    name: t("integrations.ai.label"),
    status: aiIntegrationStore.configuration?.isEnabled
      ? t("integrations.connections.status.active")
      : t("integrations.connections.status.inactive"),
    id: AI_INTEGRATION_ID,
    action: t("common.edit"),
    actionLinkBuilder: (id: string) =>
      `/organizations/${indexStore.selectedOrganization}/integrations/${id}`,
  },
]);

async function createApiKey() {
  const { data, error } = await authClient.apiKey.create({
    name: "project-api-key",
    expiresIn: 60 * 60 * 24 * 28,
    prefix: "project-api-key",
  });
  if (error) {
    notificationStore.addErrorNotification(t("integrations.apiKey.createError"));
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
  <Dialog :visible="apiKey.length > 0" modal header="API Key" :style="{ width: '75rem' }">
    <span class="text-surface-500 dark:text-surface-400 mb-8 block">{{
      t("integrations.apiKey.createSuccess")
    }}</span>
    <div class="mb-4 flex items-center gap-4">
      <InputGroup>
        <Button :label="t('common.copy')" @click="copyApiKeyToClipboard" />
        <InputText placeholder="API-Key" :readonly="true" :value="apiKey" />
      </InputGroup>
    </div>
    <div class="flex justify-end gap-2">
      <Button type="button" :label="t('common.close')" severity="secondary" @click="apiKey = ''" />
    </div>
  </Dialog>
  <DataTable :value="rows">
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-xl font-bold">{{ t("integrations.integrations") }}</span>
        <div class="flex items-center gap-2">
          <slot name="headerActions">
            <Button :label="t('integrations.apiKey.create')" @click="createApiKey" />
          </slot>
        </div>
      </div>
    </template>
    <Column field="name" :header="t('common.name')" />
    <Column field="status" :header="t('integrations.connections.status.label')" />
    <Column field="action" :header="t('common.actions')">
      <template #body="{ data }">
        <router-link
          :to="data.actionLinkBuilder(data.id)"
          class="text-primary-600 hover:text-primary-500"
        >
          {{ data.action }}
        </router-link>
      </template>
    </Column>
  </DataTable>
</template>
