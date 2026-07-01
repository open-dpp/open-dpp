<script lang="ts" setup>
import type { UniqueProductIdentifierListItemDto } from "@open-dpp/dto";
import { DigitalProductDocumentStatusDto } from "@open-dpp/dto";
import { Column, DataTable } from "primevue";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import UniqueProductIdentifierCreateDialog from "../../components/unique-product-identifier/UniqueProductIdentifierCreateDialog.vue";
import Gs1DigitalLinkPromptDialog from "../../components/unique-product-identifier/Gs1DigitalLinkPromptDialog.vue";
import { usePagination } from "../../composables/pagination";
import { useUniqueProductIdentifiers } from "../../composables/unique-product-identifiers";
import apiClient from "../../lib/api-client";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

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

async function onAddLink(_upi: UniqueProductIdentifierListItemDto) {
  promptDialogVisible.value = false;
  // Jump to this passport's permalink list, where a GS1 Digital Link permalink
  // can be created for the UPI.
  await router.push({
    name: "passportPermalinks",
    params: { organizationId: route.params.organizationId, passportId: passportId.value },
  });
}

async function onSkipPrompt() {
  promptDialogVisible.value = false;
  await reloadCurrentPage();
}

// -------------------------------------------------------------------------
// Delete
// -------------------------------------------------------------------------

async function onDeleteUpi(uuid: string) {
  await deleteUpi(uuid);
  await reloadCurrentPage();
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
    <DataTable :value="upis ?? []" :loading="loading" data-testid="upi-data-table">
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
      <Column field="referenceId" :header="t('uniqueProductIdentifiers.list.reference')" />

      <!-- Actions column: all listed UPIs (GS1 + internal) are deletable while draft (ADR 0006) -->
      <Column style="width: 5rem">
        <template #body="{ data }">
          <div data-testid="upi-row-actions" class="flex gap-1">
            <Button
              icon="pi pi-trash"
              severity="danger"
              variant="text"
              :aria-label="t('common.delete')"
              :title="t('common.delete')"
              data-testid="upi-delete-btn"
              @click="onDeleteUpi(data.uuid)"
            />
          </div>
        </template>
      </Column>
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
      @skip="onSkipPrompt"
    />
  </div>
</template>
