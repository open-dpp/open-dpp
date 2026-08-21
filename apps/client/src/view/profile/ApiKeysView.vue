<script lang="ts" setup>
import type { ApiKeyDto, PagingParamsDto } from "@open-dpp/dto";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useConfirm } from "primevue/useconfirm";
import { useRoute, useRouter } from "vue-router";
import CreateApiKeyDialog from "../../components/profile/CreateApiKeyDialog.vue";
import TablePagination from "../../components/pagination/TablePagination.vue";
import { usePagination } from "../../composables/pagination";
import apiClient from "../../lib/api-client";
import { useErrorHandlingStore } from "../../stores/error.handling";
import { useNotificationStore } from "../../stores/notification";

dayjs.extend(localizedFormat);

const { t } = useI18n();
const confirm = useConfirm();
const errorHandlingStore = useErrorHandlingStore();
const notificationStore = useNotificationStore();
const route = useRoute();
const router = useRouter();

const apiKeys = ref<ApiKeyDto[]>([]);
const loading = ref(false);
const createDialogVisible = ref(false);

const renameDialogVisible = ref(false);
const renameTarget = ref<ApiKeyDto | null>(null);
const renameValue = ref("");
const renameBusy = ref(false);

function changeQueryParams(newQuery: Record<string, string | undefined>) {
  router.replace({ query: { ...route.query, ...newQuery } });
}

async function fetchCallback(pagingParams: PagingParamsDto) {
  loading.value = true;
  try {
    const response = await apiClient.dpp.users.listApiKeys(pagingParams);
    const items = response.data?.result ?? [];
    const cursor = response.data?.paging_metadata?.cursor ?? null;
    apiKeys.value = items;
    return { paging_metadata: { cursor }, result: items };
  } catch (e) {
    errorHandlingStore.logErrorWithNotification(t("user.apiKeys.loadError"), e);
    return { paging_metadata: { cursor: null }, result: [] };
  } finally {
    loading.value = false;
  }
}

const { hasPrevious, hasNext, currentPage, previousPage, resetCursor, nextPage, reloadCurrentPage } =
  usePagination({
    initialCursor: route.query.cursor ? String(route.query.cursor) : undefined,
    limit: 10,
    fetchCallback,
    changeQueryParams,
  });

function maskedKey(apiKey: ApiKeyDto): string {
  return apiKey.start ? `${apiKey.start}…` : "•••••";
}

function formatDate(value: string | null): string {
  return value ? dayjs(value).format("LLL") : "—";
}

async function onCreated() {
  await reloadCurrentPage();
}

function openRenameDialog(apiKey: ApiKeyDto) {
  renameTarget.value = apiKey;
  renameValue.value = apiKey.name;
  renameDialogVisible.value = true;
}

async function submitRename() {
  if (!renameTarget.value || renameValue.value.trim().length === 0 || renameBusy.value) return;
  renameBusy.value = true;
  try {
    await apiClient.dpp.users.updateApiKey(renameTarget.value.id, {
      name: renameValue.value.trim(),
    });
    notificationStore.addSuccessNotification(t("user.apiKeys.renameSuccess"));
    renameDialogVisible.value = false;
    await reloadCurrentPage();
  } catch (e) {
    errorHandlingStore.logErrorWithNotification(t("user.apiKeys.renameError"), e);
  } finally {
    renameBusy.value = false;
  }
}

function onRevoke(apiKey: ApiKeyDto) {
  confirm.require({
    message: t("user.apiKeys.revokeConfirmMessage"),
    header: t("user.apiKeys.revokeConfirmHeader"),
    icon: "pi pi-info-circle",
    rejectLabel: t("common.cancel"),
    rejectProps: { label: t("common.cancel"), severity: "secondary", outlined: true },
    acceptProps: { label: t("user.apiKeys.revoke"), severity: "danger" },
    accept: async () => {
      try {
        await apiClient.dpp.users.deleteApiKey(apiKey.id);
        notificationStore.addSuccessNotification(t("user.apiKeys.revokeSuccess"));
        await reloadCurrentPage();
      } catch (e) {
        errorHandlingStore.logErrorWithNotification(t("user.apiKeys.revokeError"), e);
      }
    },
  });
}

onMounted(async () => {
  await nextPage();
});
</script>

<template>
  <Card>
    <template #content>
      <DataTable
        :value="apiKeys"
        :loading="loading"
        data-testid="api-keys-table"
        paginator
        :rows="10"
        :rows-per-page-options="[10]"
      >
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-xl font-bold">{{ t("user.apiKeys.title") }}</span>
            <Button
              :label="t('user.apiKeys.create')"
              data-testid="api-key-create-btn"
              @click="createDialogVisible = true"
            />
          </div>
        </template>

        <template #empty>
          <p data-testid="api-keys-empty">{{ t("user.apiKeys.empty") }}</p>
        </template>

        <Column field="name" :header="t('user.apiKeys.name')" />

        <Column :header="t('user.apiKeys.key')">
          <template #body="{ data }">
            <code :data-testid="`api-key-masked-${data.id}`">{{ maskedKey(data) }}</code>
          </template>
        </Column>

        <Column :header="t('user.apiKeys.createdAt')">
          <template #body="{ data }">
            {{ formatDate(data.createdAt) }}
          </template>
        </Column>

        <Column :header="t('user.apiKeys.expiresAt')">
          <template #body="{ data }">
            {{ data.expiresAt ? formatDate(data.expiresAt) : t("user.apiKeys.noExpiry") }}
          </template>
        </Column>

        <Column :header="t('user.apiKeys.lastUsedAt')">
          <template #body="{ data }">
            {{ data.lastUsedAt ? formatDate(data.lastUsedAt) : t("user.apiKeys.neverUsed") }}
          </template>
        </Column>

        <Column :header="t('common.actions')">
          <template #body="{ data }">
            <div class="flex gap-1">
              <Button
                icon="pi pi-pencil"
                severity="primary"
                :aria-label="t('common.edit')"
                :title="t('common.edit')"
                :data-testid="`api-key-rename-btn-${data.id}`"
                @click="openRenameDialog(data)"
              />
              <Button
                icon="pi pi-trash"
                severity="danger"
                :aria-label="t('user.apiKeys.revoke')"
                :title="t('user.apiKeys.revoke')"
                :data-testid="`api-key-revoke-btn-${data.id}`"
                @click="onRevoke(data)"
              />
            </div>
          </template>
        </Column>

        <template #paginatorcontainer>
          <TablePagination
            :current-page="currentPage"
            :has-previous="hasPrevious"
            :has-next="hasNext"
            @reset-cursor="resetCursor"
            @previous-page="previousPage"
            @next-page="nextPage"
          />
        </template>
      </DataTable>

      <CreateApiKeyDialog v-model:visible="createDialogVisible" @created="onCreated" />

      <Dialog
        v-model:visible="renameDialogVisible"
        modal
        :header="t('user.apiKeys.renameTitle')"
        :style="{ width: '25rem' }"
      >
        <div class="flex flex-col gap-1">
          <label for="api-key-rename">{{ t("user.apiKeys.name") }}</label>
          <InputText
            id="api-key-rename"
            v-model="renameValue"
            data-testid="api-key-rename-input"
            autofocus
            @keyup.enter="submitRename"
          />
        </div>
        <template #footer>
          <Button
            :label="t('common.cancel')"
            severity="secondary"
            outlined
            @click="renameDialogVisible = false"
          />
          <Button
            :label="t('common.save')"
            :disabled="renameValue.trim().length === 0 || renameBusy"
            :loading="renameBusy"
            data-testid="api-key-rename-submit"
            @click="submitRename"
          />
        </template>
      </Dialog>
    </template>
  </Card>
</template>
