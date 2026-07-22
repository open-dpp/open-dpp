<script lang="ts" setup>
import type { UniqueProductIdentifierListItemDto } from "@open-dpp/dto";
import { DigitalProductDocumentStatusDto, PermalinkKind } from "@open-dpp/dto";
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

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const confirm = useConfirm();

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
// A GS1 UPI can only be created while this passport is a draft; resolved on open.
const passportIsDraft = ref(false);

async function openCreateDialog() {
  const { data } = await apiClient.dpp.passports.getById(passportId.value);
  passportIsDraft.value =
    data.lastStatusChange.currentStatus === DigitalProductDocumentStatusDto.Draft;
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
// Delete (confirmed)
// -------------------------------------------------------------------------

function onDeleteUpi(uuid: string) {
  confirm.require({
    message: t("uniqueProductIdentifiers.list.deleteConfirmMessage"),
    header: t("uniqueProductIdentifiers.list.deleteConfirmHeader"),
    icon: "pi pi-info-circle",
    rejectLabel: t("common.cancel"),
    rejectProps: { label: t("common.cancel"), severity: "secondary", outlined: true },
    acceptProps: { label: t("common.delete"), severity: "danger" },
    accept: async () => {
      await deleteUpi(uuid);
      await reloadCurrentPage();
    },
  });
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
           rows without one; all listed UPIs (GS1 + internal) are deletable (ADR 0006) -->
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
              :aria-label="t('common.delete')"
              :title="t('common.delete')"
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
