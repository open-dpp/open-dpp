<script lang="ts" setup>
import type {
  UniqueProductIdentifierListItemDto,
  UniqueProductIdentifierTypeValue,
} from "@open-dpp/dto";
import {
  DigitalProductDocumentStatusDto,
  PermalinkKind,
  UniqueProductIdentifierType,
} from "@open-dpp/dto";
import { Column, DataTable } from "primevue";
import { useConfirm } from "primevue/useconfirm";
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import UniqueProductIdentifierCreateDialog from "../../components/unique-product-identifier/UniqueProductIdentifierCreateDialog.vue";
import Gs1DigitalLinkPromptDialog from "../../components/unique-product-identifier/Gs1DigitalLinkPromptDialog.vue";
import PermalinkQrCode from "../../components/permalinks/PermalinkQrCode.vue";
import TablePagination from "../../components/pagination/TablePagination.vue";
import { usePagination } from "../../composables/pagination";
import { useUniqueProductIdentifiers } from "../../composables/unique-product-identifiers";
import apiClient from "../../lib/api-client";
import { useErrorHandlingStore } from "../../stores/error.handling";
import { useNotificationStore } from "../../stores/notification";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const confirm = useConfirm();
const errorHandlingStore = useErrorHandlingStore();
const notificationStore = useNotificationStore();

// The passport this list is scoped to (from the nested route param).
const passportId = computed(() => String(route.params.passportId));

// -------------------------------------------------------------------------
// Pagination wiring
// -------------------------------------------------------------------------

function changeQueryParams(newQuery: Record<string, string | undefined>) {
  router.replace({
    query: {
      ...route.query,
      ...newQuery,
    },
  });
}

const { upis, loading, fetchUniqueProductIdentifiers, createGs1Upi, createInternalUpi, deleteUpi } =
  useUniqueProductIdentifiers();

function fetchCallback(pagingParams: { limit?: number; cursor?: string }) {
  return fetchUniqueProductIdentifiers(passportId.value, pagingParams);
}

const {
  hasPrevious,
  hasNext,
  currentPage,
  previousPage,
  resetCursor,
  nextPage,
  reloadCurrentPage,
} = usePagination({
  initialCursor: route.query.cursor ? String(route.query.cursor) : undefined,
  limit: 10,
  fetchCallback,
  changeQueryParams,
});

// -------------------------------------------------------------------------
// Create dialog
// -------------------------------------------------------------------------

const createDialogVisible = ref(false);
// Gates both creating a GS1 UPI and deleting any UPI — both are draft-only on the
// backend. Loaded on mount (the delete buttons need it at first render) and
// refreshed when the create dialog opens. Stays false if the fetch fails, so both
// actions stay locked rather than failing later with a 409.
const passportIsDraft = ref(false);

async function loadPassportStatus() {
  const { data } = await apiClient.dpp.passports.getById(passportId.value);
  passportIsDraft.value =
    data.lastStatusChange.currentStatus === DigitalProductDocumentStatusDto.Draft;
}

async function openCreateDialog() {
  await loadPassportStatus();
  createDialogVisible.value = true;
}

// -------------------------------------------------------------------------
// GS1 Digital Link prompt dialog
// -------------------------------------------------------------------------

const promptDialogVisible = ref(false);
const promptUpi = ref<UniqueProductIdentifierListItemDto | null>(null);

async function onUpiCreated(upi: UniqueProductIdentifierListItemDto) {
  createDialogVisible.value = false;
  // The GS1 Digital Link prompt only applies to GS1 UPIs; an internal UPI has no
  // structured key to build a Digital Link from, so just refresh the list.
  if (upi.type === "GS1") {
    promptUpi.value = upi;
    promptDialogVisible.value = true;
  } else {
    await reloadCurrentPage();
  }
}

async function onAddLink(upi: UniqueProductIdentifierListItemDto) {
  // Jump to this passport's permalink list with the UPI preselected for permalink
  // creation. The prompt stays open — a successful navigation unmounts this view,
  // and closing it here would trigger the close-watch reload mid-navigation.
  await router.push({
    name: "passportPermalinks",
    params: { organizationId: route.params.organizationId, passportId: passportId.value },
    query: { createForUpi: upi.uuid },
  });
}

// Any close of the prompt (Skip button, ESC, mask click) means the user stays on
// this list — refresh it so the newly created UPI row appears.
watch(promptDialogVisible, async (visible) => {
  if (!visible) {
    await reloadCurrentPage();
  }
});

// -------------------------------------------------------------------------
// QR dialog
// -------------------------------------------------------------------------

const qrDialogVisible = ref(false);
const qrUpi = ref<UniqueProductIdentifierListItemDto | null>(null);

function openQrDialog(upi: UniqueProductIdentifierListItemDto) {
  qrUpi.value = upi;
  qrDialogVisible.value = true;
}

// The row's permalink summary carries no kind — by definition it is the UPI's
// gs1-link permalink (max one per UPI), so the kind is constant here.
const qrPermalink = computed(() =>
  qrUpi.value?.permalink
    ? { kind: PermalinkKind.GS1_LINK, publicUrl: qrUpi.value.permalink.publicUrl }
    : null,
);

const qrIdentity = computed(() =>
  qrUpi.value?.gtin
    ? { gtin: qrUpi.value.gtin, batch: qrUpi.value.batch, serial: qrUpi.value.serial }
    : null,
);

// -------------------------------------------------------------------------
// Delete (guarded)
// -------------------------------------------------------------------------

// GTIN / EAN rows are read-only system rows; only these two types are user-managed.
const USER_MANAGED_TYPES: UniqueProductIdentifierTypeValue[] = [
  UniqueProductIdentifierType.GS1,
  UniqueProductIdentifierType.OPEN_DPP_UUID,
];

/**
 * Mirrors the backend guard in `UpiCollectionService.delete`: a UPI can be deleted
 * when it is user-managed (GS1 / OPEN_DPP_UUID) AND its passport is still a draft
 * (ADR 0006). Anything else answers 409, so the button is disabled instead.
 */
function canDelete(upi: UniqueProductIdentifierListItemDto): boolean {
  return passportIsDraft.value && USER_MANAGED_TYPES.includes(upi.type);
}

function deleteTooltip(upi: UniqueProductIdentifierListItemDto): string {
  if (!USER_MANAGED_TYPES.includes(upi.type)) {
    return t("uniqueProductIdentifiers.list.systemReadOnly");
  }
  if (!passportIsDraft.value) {
    return t("uniqueProductIdentifiers.list.deleteLockedTooltip");
  }
  return t("uniqueProductIdentifiers.list.delete");
}

function onDeleteUpi(uuid: string) {
  confirm.require({
    message: t("uniqueProductIdentifiers.list.deleteConfirmMessage"),
    header: t("uniqueProductIdentifiers.list.deleteConfirmHeader"),
    icon: "pi pi-info-circle",
    rejectLabel: t("common.cancel"),
    rejectProps: { label: t("common.cancel"), severity: "secondary", outlined: true },
    acceptProps: { label: t("uniqueProductIdentifiers.list.delete"), severity: "danger" },
    accept: async () => {
      try {
        await deleteUpi(uuid);
        notificationStore.addSuccessNotification(t("uniqueProductIdentifiers.list.deleteSuccess"));
        await reloadCurrentPage();
      } catch (e) {
        errorHandlingStore.logErrorWithNotification(
          t("uniqueProductIdentifiers.list.deleteError"),
          e,
        );
      }
    },
  });
}

// -------------------------------------------------------------------------
// Mount
// -------------------------------------------------------------------------

onMounted(async () => {
  // A failing status fetch must not block the list: passportIsDraft stays false,
  // which locks create + delete rather than letting them 409 later.
  await Promise.all([
    loadPassportStatus().catch((e) =>
      errorHandlingStore.logErrorWithNotification(t("common.errorOccurred"), e),
    ),
    nextPage(),
  ]);
});
</script>

<template>
  <div>
    <ConfirmDialog />

    <DataTable
      :value="upis ?? []"
      :loading="loading"
      data-testid="upi-data-table"
      paginator
      :rows="10"
      :rows-per-page-options="[10]"
    >
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-xl font-bold">{{ t("uniqueProductIdentifiers.label", 2) }}</span>
          <Button :label="t('common.add')" data-testid="upi-add-btn" @click="openCreateDialog" />
        </div>
      </template>

      <Column field="type" :header="t('uniqueProductIdentifiers.list.type')" />
      <Column field="gtin" :header="t('uniqueProductIdentifiers.list.gtin')">
        <template #body="{ data }">
          <span>{{ data.gtin ?? "" }}</span>
        </template>
      </Column>
      <Column field="batch" :header="t('uniqueProductIdentifiers.list.batch')">
        <template #body="{ data }">
          <span>{{ data.batch ?? "" }}</span>
        </template>
      </Column>
      <Column field="serial" :header="t('uniqueProductIdentifiers.list.serial')">
        <template #body="{ data }">
          <span>{{ data.serial ?? "" }}</span>
        </template>
      </Column>
      <!-- Actions column: QR for rows with a gs1-link permalink, create-CTA for GS1
           rows without one; delete only for user-managed rows on a draft passport
           (ADR 0006) — otherwise disabled with a tooltip explaining the lock -->
      <Column style="width: 9rem">
        <template #body="{ data }">
          <div data-testid="upi-row-actions" class="flex gap-1">
            <Button
              v-if="data.permalink"
              icon="pi pi-qrcode"
              severity="info"
              :aria-label="t('common.qrCode')"
              :title="t('common.qrCode')"
              data-testid="upi-qr-btn"
              @click="openQrDialog(data)"
            />
            <Button
              v-else-if="data.type === 'GS1'"
              icon="pi pi-link"
              severity="primary"
              :aria-label="t('uniqueProductIdentifiers.list.createPermalink')"
              :title="t('uniqueProductIdentifiers.list.createPermalink')"
              data-testid="upi-permalink-create"
              @click="onAddLink(data)"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              :aria-label="t('uniqueProductIdentifiers.list.delete')"
              :title="deleteTooltip(data)"
              :disabled="!canDelete(data)"
              data-testid="upi-delete-btn"
              @click="onDeleteUpi(data.uuid)"
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

    <UniqueProductIdentifierCreateDialog
      v-model:visible="createDialogVisible"
      :passport-id="passportId"
      :is-draft="passportIsDraft"
      :create-gs1-upi="createGs1Upi"
      :create-internal-upi="createInternalUpi"
      @created="onUpiCreated"
    />

    <Gs1DigitalLinkPromptDialog
      v-if="promptUpi"
      v-model:visible="promptDialogVisible"
      :upi="promptUpi"
      @add-link="onAddLink"
    />

    <!-- QR dialog: rendered entirely from row data, no extra fetch -->
    <Dialog v-model:visible="qrDialogVisible" modal :header="t('common.qrCode')">
      <PermalinkQrCode v-if="qrPermalink" :permalink="qrPermalink" :identity="qrIdentity" />
    </Dialog>
  </div>
</template>
