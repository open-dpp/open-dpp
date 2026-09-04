<script lang="ts" setup>
import type {
  PagingParamsDto,
  PermalinkPublicDto,
  PresentationConfigurationDto,
} from "@open-dpp/dto";
import {
  DigitalProductDocumentStatusDto,
  PermalinkKind,
  UniqueProductIdentifierType,
} from "@open-dpp/dto";
import { Column, DataTable } from "primevue";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useConfirm } from "primevue/useconfirm";
import { useRoute, useRouter } from "vue-router";
import PermalinkCreateDialog from "../../components/permalinks/PermalinkCreateDialog.vue";
import PermalinkEditDialog from "../../components/permalinks/PermalinkEditDialog.vue";
import PermalinkQrCode from "../../components/permalinks/PermalinkQrCode.vue";
import TablePagination from "../../components/pagination/TablePagination.vue";
import { useDigitalProductDocument } from "../../composables/digital-product-document";
import { usePagination } from "../../composables/pagination";
import { useUniqueProductIdentifiers } from "../../composables/unique-product-identifiers";
import apiClient from "../../lib/api-client";
import { DigitalProductDocumentType } from "../../lib/digital-product-document";
import { useErrorHandlingStore } from "../../stores/error.handling";
import { useNotificationStore } from "../../stores/notification";
import ContentViewWrapper from "../ContentViewWrapper.vue";

const { t } = useI18n();
const confirm = useConfirm();
const errorHandlingStore = useErrorHandlingStore();
const notificationStore = useNotificationStore();
const route = useRoute();
const router = useRouter();
const { fetchById: fetchPassportById } = useDigitalProductDocument(
  DigitalProductDocumentType.Passport,
);

const passportId = computed(() => String(route.params.passportId));

const permalinks = ref<PermalinkPublicDto[]>([]);
const loading = ref(false);
const createDialogVisible = ref(false);

const preselectedUpiId = ref(
  route.query.createForUpi ? String(route.query.createForUpi) : undefined,
);

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
    const items = (response.data?.result ?? []) as PermalinkPublicDto[];
    const cursor = response.data?.paging_metadata?.cursor ?? null;
    permalinks.value = items;
    return { paging_metadata: { cursor }, result: items };
  } finally {
    loading.value = false;
  }
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

const editDialogVisible = ref(false);
const selectedPermalink = ref<PermalinkPublicDto | null>(null);

const qrDialogVisible = ref(false);
const qrPermalink = ref<PermalinkPublicDto | null>(null);

const passportIsPublished = ref(false);

async function loadPassportStatus() {
  const passport = await fetchPassportById(passportId.value);
  passportIsPublished.value =
    passport?.lastStatusChange.currentStatus === DigitalProductDocumentStatusDto.Published;
}

const { upis, fetchUniqueProductIdentifiers } = useUniqueProductIdentifiers();

const UPI_PICKER_LIMIT = 1000;

async function loadUpis() {
  try {
    await fetchUniqueProductIdentifiers(passportId.value, { limit: UPI_PICKER_LIMIT });
  } catch (e) {
    errorHandlingStore.logErrorWithNotification(t("permalink.create.loadFailed"), e);
  }
}

const linkableUpis = computed(() =>
  upis.value.filter(
    (upi) =>
      (upi.type === UniqueProductIdentifierType.GS1 && upi.permalink == null) ||
      upi.type === UniqueProductIdentifierType.OPEN_DPP_UUID,
  ),
);

const configs = ref<PresentationConfigurationDto[]>([]);

async function loadConfigs() {
  try {
    const response = await apiClient.dpp.passports.presentationConfiguration.list(passportId.value);
    configs.value = response.data ?? [];
  } catch (e) {
    errorHandlingStore.logErrorWithNotification(t("permalink.create.loadFailed"), e);
  }
}

async function openCreateDialog() {
  await Promise.all([loadUpis(), loadConfigs()]);
  createDialogVisible.value = true;
}

async function onPermalinkCreated(_permalink: PermalinkPublicDto) {
  createDialogVisible.value = false;
  await Promise.all([reloadCurrentPage(), loadUpis()]);
}

function openEditDialog(permalink: PermalinkPublicDto) {
  selectedPermalink.value = permalink;
  editDialogVisible.value = true;
}

async function onPermalinkUpdated(_permalink: PermalinkPublicDto) {
  editDialogVisible.value = false;
  await reloadCurrentPage();
}

function openQrDialog(permalink: PermalinkPublicDto) {
  qrPermalink.value = permalink;
  qrDialogVisible.value = true;
}

function canDelete(permalink: PermalinkPublicDto): boolean {
  return permalink.publishedUrl == null;
}

function deleteTooltip(permalink: PermalinkPublicDto): string {
  if (permalink.publishedUrl != null) {
    return t("permalink.list.deletePublishedTooltip");
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

function kindLabel(kind: string): string {
  if (kind === PermalinkKind.GS1_LINK) {
    return t("permalink.list.kindGs1Link");
  }
  return t("permalink.list.kindPresentation");
}

onMounted(async () => {
  await Promise.all([loadPassportStatus().catch(() => undefined), nextPage()]);
  if (preselectedUpiId.value) {
    await openCreateDialog();
    changeQueryParams({ createForUpi: undefined });
  }
});
</script>

<template>
  <ContentViewWrapper>
    <Message
      v-if="passportIsPublished"
      severity="info"
      class="mb-4"
      data-testid="permalink-frozen-info"
    >
      {{ t("permalink.list.frozenInfo") }}
    </Message>

    <DataTable
      :value="permalinks"
      :loading="loading"
      data-testid="permalink-data-table"
      paginator
      :rows="10"
      :rows-per-page-options="[10]"
    >
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-xl font-bold">{{ t("permalink.list.label", 2) }}</span>
          <Button
            :label="t('permalink.list.createPermalink')"
            data-testid="permalink-create-btn"
            @click="openCreateDialog"
          />
        </div>
      </template>

      <Column field="kind" :header="t('permalink.list.kind')">
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <span :data-testid="`permalink-kind-${data.id}`">
              {{ kindLabel(data.kind) }}
            </span>
          </div>
        </template>
      </Column>

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

      <Column :header="t('common.actions')">
        <template #body="{ data }">
          <div class="flex gap-1">
            <Button
              icon="pi pi-qrcode"
              severity="info"
              :aria-label="t('common.qrCode')"
              :title="t('common.qrCode')"
              :data-testid="`permalink-show-qr-btn-${data.id}`"
              @click="openQrDialog(data)"
            />

            <Button
              icon="pi pi-pencil"
              severity="primary"
              :aria-label="t('common.edit')"
              :title="t('common.edit')"
              :data-testid="`permalink-edit-btn-${data.id}`"
              @click="openEditDialog(data)"
            />

            <Button
              icon="pi pi-trash"
              severity="danger"
              :aria-label="t('permalink.list.delete')"
              :data-testid="`permalink-delete-btn-${data.id}`"
              :disabled="!canDelete(data)"
              :title="deleteTooltip(data)"
              @click="onDelete(data)"
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

    <PermalinkCreateDialog
      v-model:visible="createDialogVisible"
      :passport-id="passportId"
      :upis="linkableUpis"
      :configs="configs"
      :preselected-upi-id="preselectedUpiId"
      @created="onPermalinkCreated"
    />

    <PermalinkEditDialog
      v-if="selectedPermalink"
      v-model:visible="editDialogVisible"
      :permalink="selectedPermalink"
      @updated="onPermalinkUpdated"
    />

    <Dialog v-model:visible="qrDialogVisible" modal :header="t('common.qrCode')">
      <PermalinkQrCode v-if="qrPermalink" :permalink="qrPermalink" />
    </Dialog>
  </ContentViewWrapper>
</template>
