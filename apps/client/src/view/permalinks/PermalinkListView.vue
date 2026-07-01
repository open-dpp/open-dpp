<script lang="ts" setup>
import type { PagingParamsDto, PermalinkPublicDto } from "@open-dpp/dto";
import { PermalinkKind } from "@open-dpp/dto";
import { Column, DataTable } from "primevue";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useConfirm } from "primevue/useconfirm";
import { useRoute, useRouter } from "vue-router";
import PermalinkCreateGs1LinkDialog from "../../components/permalinks/PermalinkCreateGs1LinkDialog.vue";
import PermalinkEditDialog from "../../components/permalinks/PermalinkEditDialog.vue";
import Gs1LinkQrCode from "../../components/permalinks/Gs1LinkQrCode.vue";
import { usePagination } from "../../composables/pagination";
import apiClient from "../../lib/api-client";
import { useErrorHandlingStore } from "../../stores/error.handling";
import { useNotificationStore } from "../../stores/notification";

const { t } = useI18n();
const confirm = useConfirm();
const errorHandlingStore = useErrorHandlingStore();
const notificationStore = useNotificationStore();
const route = useRoute();
const router = useRouter();

// The passport this list is scoped to (from the nested route param).
const passportId = computed(() => String(route.params.passportId));

// -------------------------------------------------------------------------
// State
// -------------------------------------------------------------------------

const permalinks = ref<PermalinkPublicDto[]>([]);
const loading = ref(false);
const createGs1DialogVisible = ref(false);

// -------------------------------------------------------------------------
// Pagination wiring (server-side cursor pagination, mirrors the other list views)
// -------------------------------------------------------------------------

function changeQueryParams(newQuery: Record<string, string | undefined>) {
  router.replace({
    query: {
      ...route.query,
      ...newQuery,
    },
  });
}

async function fetchCallback(pagingParams: PagingParamsDto) {
  loading.value = true;
  try {
    const response = await apiClient.dpp.passports.getPermalinks(passportId.value, pagingParams);
    // The passport-scoped list returns the standard cursor envelope
    // ({ paging_metadata, result }) — expose the rows and surface the next cursor.
    const items = (response.data?.result ?? []) as PermalinkPublicDto[];
    const cursor = response.data?.paging_metadata?.cursor ?? null;
    permalinks.value = items;
    return { paging_metadata: { cursor }, result: items };
  } finally {
    loading.value = false;
  }
}

const { nextPage, reloadCurrentPage } = usePagination({
  initialCursor: route.query.cursor ? String(route.query.cursor) : undefined,
  limit: 10,
  fetchCallback,
  changeQueryParams,
});

// -------------------------------------------------------------------------
// Edit dialog state
// -------------------------------------------------------------------------

const editDialogVisible = ref(false);
const selectedPermalink = ref<PermalinkPublicDto | null>(null);

// -------------------------------------------------------------------------
// QR dialog state
// -------------------------------------------------------------------------

const qrDialogVisible = ref(false);
const qrPermalink = ref<PermalinkPublicDto | null>(null);

// -------------------------------------------------------------------------
// Derived: existing gs1-link UPI ids (for the create dialog)
// -------------------------------------------------------------------------

function existingGs1LinkUpiIds(): string[] {
  return permalinks.value
    .filter((pl) => pl.kind === PermalinkKind.GS1_LINK && pl.uniqueProductIdentifierId != null)
    .map((pl) => pl.uniqueProductIdentifierId as string);
}

// -------------------------------------------------------------------------
// Derived: presentation permalink count (for guarded delete)
// -------------------------------------------------------------------------

const presentationPermalinkCount = computed(
  () => permalinks.value.filter((pl) => pl.kind === PermalinkKind.PRESENTATION).length,
);

// -------------------------------------------------------------------------
// Create dialog
// -------------------------------------------------------------------------

function openCreateGs1Dialog() {
  createGs1DialogVisible.value = true;
}

async function onPermalinkCreated(_permalink: PermalinkPublicDto) {
  createGs1DialogVisible.value = false;
  await reloadCurrentPage();
}

// -------------------------------------------------------------------------
// Edit dialog
// -------------------------------------------------------------------------

function openEditDialog(permalink: PermalinkPublicDto) {
  selectedPermalink.value = permalink;
  editDialogVisible.value = true;
}

async function onPermalinkUpdated(_permalink: PermalinkPublicDto) {
  editDialogVisible.value = false;
  await reloadCurrentPage();
}

// -------------------------------------------------------------------------
// QR dialog
// -------------------------------------------------------------------------

function openQrDialog(permalink: PermalinkPublicDto) {
  qrPermalink.value = permalink;
  qrDialogVisible.value = true;
}

// -------------------------------------------------------------------------
// Set primary
// -------------------------------------------------------------------------

async function onSetPrimary(permalink: PermalinkPublicDto) {
  try {
    await apiClient.dpp.permalinks.setPrimary(permalink.id);
    notificationStore.addSuccessNotification(t("permalink.list.setPrimarySuccess"));
    await reloadCurrentPage();
  } catch (e) {
    errorHandlingStore.logErrorWithNotification(t("permalink.list.setPrimaryError"), e);
  }
}

// -------------------------------------------------------------------------
// Delete (guarded)
// -------------------------------------------------------------------------

/**
 * A permalink can be deleted when:
 *  - it is not published (publishedUrl is null)
 *  - AND it is not the primary presentation permalink
 *  - AND it is not the last/sole presentation permalink
 */
function canDelete(permalink: PermalinkPublicDto): boolean {
  if (permalink.publishedUrl != null) return false;
  if (permalink.kind === PermalinkKind.PRESENTATION) {
    if (permalink.primary) return false;
    if (presentationPermalinkCount.value <= 1) return false;
  }
  return true;
}

function deleteTooltip(permalink: PermalinkPublicDto): string {
  if (permalink.publishedUrl != null) {
    return t("permalink.list.deletePublishedTooltip");
  }
  if (
    permalink.kind === PermalinkKind.PRESENTATION &&
    (permalink.primary || presentationPermalinkCount.value <= 1)
  ) {
    return t("permalink.list.deletePrimaryTooltip");
  }
  return t("permalink.list.delete");
}

async function onDelete(permalink: PermalinkPublicDto) {
  confirm.require({
    message: t("permalink.list.deleteConfirmMessage"),
    header: t("permalink.list.deleteConfirmHeader"),
    icon: "pi pi-info-circle",
    rejectLabel: t("common.cancel"),
    rejectProps: { label: t("common.cancel"), severity: "secondary", outlined: true },
    acceptProps: { label: t("permalink.list.delete"), severity: "danger" },
    accept: async () => {
      try {
        await apiClient.dpp.permalinks.delete(permalink.id);
        notificationStore.addSuccessNotification(t("permalink.list.deleteSuccess"));
        await reloadCurrentPage();
      } catch (e) {
        errorHandlingStore.logErrorWithNotification(t("permalink.list.deleteError"), e);
      }
    },
  });
}

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------

function kindLabel(kind: string): string {
  if (kind === PermalinkKind.GS1_LINK) {
    return t("permalink.list.kindGs1Link");
  }
  return t("permalink.list.kindPresentation");
}

// -------------------------------------------------------------------------
// Mount
// -------------------------------------------------------------------------

onMounted(async () => {
  await nextPage();
});
</script>

<template>
  <div>
    <ConfirmDialog />

    <DataTable :value="permalinks" :loading="loading" data-testid="permalink-data-table">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-xl font-bold">{{ t("permalink.list.label", 2) }}</span>
          <Button
            :label="t('permalink.list.createGs1Link')"
            data-testid="permalink-create-gs1-link-btn"
            @click="openCreateGs1Dialog"
          />
        </div>
      </template>

      <!-- Kind column -->
      <Column field="kind" :header="t('permalink.list.kind')">
        <template #body="{ data }">
          <span :data-testid="`permalink-kind-${data.id}`">
            {{ kindLabel(data.kind) }}
          </span>
        </template>
      </Column>

      <!-- Public URL column -->
      <Column field="publicUrl" :header="t('permalink.list.publicUrl')">
        <template #body="{ data }">
          <a
            :href="data.publicUrl"
            target="_blank"
            rel="noopener noreferrer"
            :data-testid="`permalink-public-url-${data.id}`"
          >
            {{ data.publicUrl }}
          </a>
        </template>
      </Column>

      <!-- Primary column -->
      <Column :header="t('permalink.list.primary')">
        <template #body="{ data }">
          <Tag
            v-if="data.primary"
            :value="t('permalink.list.primary')"
            severity="success"
            :data-testid="`permalink-primary-badge-${data.id}`"
          />
        </template>
      </Column>

      <!-- Published column -->
      <Column :header="t('permalink.list.published')">
        <template #body="{ data }">
          <Tag
            v-if="data.publishedUrl"
            :value="t('permalink.list.published')"
            severity="info"
            :data-testid="`permalink-published-badge-${data.id}`"
          />
        </template>
      </Column>

      <!-- Actions column -->
      <Column :header="t('common.actions')">
        <template #body="{ data }">
          <div class="flex gap-2">
            <!-- Edit button (all rows) -->
            <Button
              :label="t('common.edit')"
              :data-testid="`permalink-edit-btn-${data.id}`"
              severity="secondary"
              variant="text"
              @click="openEditDialog(data)"
            />

            <!-- Set primary button (non-primary presentation rows only) -->
            <Button
              v-if="data.kind === PermalinkKind.PRESENTATION && !data.primary"
              :label="t('permalink.list.setPrimary')"
              :data-testid="`permalink-set-primary-btn-${data.id}`"
              severity="secondary"
              variant="text"
              @click="onSetPrimary(data)"
            />

            <!-- Show QR button (gs1-link rows only) -->
            <Button
              v-if="data.kind === PermalinkKind.GS1_LINK"
              :label="t('common.qrCode')"
              :data-testid="`permalink-show-qr-btn-${data.id}`"
              severity="secondary"
              variant="text"
              @click="openQrDialog(data)"
            />

            <!-- Delete button -->
            <Button
              :label="t('permalink.list.delete')"
              :data-testid="`permalink-delete-btn-${data.id}`"
              severity="danger"
              variant="text"
              :disabled="!canDelete(data)"
              :title="deleteTooltip(data)"
              @click="onDelete(data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Create GS1 Link dialog -->
    <PermalinkCreateGs1LinkDialog
      v-model:visible="createGs1DialogVisible"
      :existing-gs1-link-upi-ids="existingGs1LinkUpiIds()"
      @created="onPermalinkCreated"
    />

    <!-- Edit dialog -->
    <PermalinkEditDialog
      v-if="selectedPermalink"
      v-model:visible="editDialogVisible"
      :permalink="selectedPermalink"
      @updated="onPermalinkUpdated"
    />

    <!-- QR dialog -->
    <Dialog v-model:visible="qrDialogVisible" modal :header="t('common.qrCode')">
      <Gs1LinkQrCode v-if="qrPermalink" :permalink="qrPermalink" />
    </Dialog>
  </div>
</template>
