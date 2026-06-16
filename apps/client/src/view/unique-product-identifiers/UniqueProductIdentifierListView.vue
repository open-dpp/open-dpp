<script lang="ts" setup>
import type { UniqueProductIdentifierListItemDto, PassportDto } from "@open-dpp/dto";
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

const { upis, loading, fetchUniqueProductIdentifiers, deleteUpi } = useUniqueProductIdentifiers();

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
// Draft passports (for the create dialog)
// -------------------------------------------------------------------------

const draftPassports = ref<PassportDto[]>([]);

async function loadDraftPassports() {
  const response = await apiClient.dpp.passports.getAll({
    pagination: { limit: 100 },
    filter: { status: [DigitalProductDocumentStatusDto.Draft] },
  });
  draftPassports.value = (response.data.result ?? []) as PassportDto[];
}

// -------------------------------------------------------------------------
// Create dialog
// -------------------------------------------------------------------------

const createDialogVisible = ref(false);

function openCreateDialog() {
  void loadDraftPassports();
  createDialogVisible.value = true;
}

// -------------------------------------------------------------------------
// GS1 Digital Link prompt dialog
// -------------------------------------------------------------------------

const promptDialogVisible = ref(false);
const promptUpi = ref<UniqueProductIdentifierListItemDto | null>(null);

async function onUpiCreated(upi: UniqueProductIdentifierListItemDto) {
  createDialogVisible.value = false;
  promptUpi.value = upi;
  promptDialogVisible.value = true;
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
    <DataTable
      :value="upis ?? []"
      :loading="loading"
      data-testid="upi-data-table"
    >
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-xl font-bold">{{ t("uniqueProductIdentifiers.label", 2) }}</span>
          <Button
            :label="t('common.add')"
            data-testid="upi-add-btn"
            @click="openCreateDialog"
          />
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

      <!-- Actions column: delete only for non-OPEN_DPP_UUID rows -->
      <Column style="width: 5rem">
        <template #body="{ data }">
          <div
            :data-testid="data.type === 'OPEN_DPP_UUID' ? 'upi-row-system-actions' : 'upi-row-gs1-actions'"
            class="flex gap-1"
          >
            <span
              v-if="data.type === 'OPEN_DPP_UUID'"
              class="text-sm text-gray-400"
            >
              {{ t("uniqueProductIdentifiers.list.systemReadOnly") }}
            </span>
            <Button
              v-if="data.type !== 'OPEN_DPP_UUID'"
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
      :draft-passports="draftPassports"
      :create-gs1-upi="useUniqueProductIdentifiers().createGs1Upi"
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
