<script lang="ts" setup>
import type { PagingParamsDto, PermalinkPublicDto } from "@open-dpp/dto";
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
import PermalinkCreateGs1LinkDialog from "../../components/permalinks/PermalinkCreateGs1LinkDialog.vue";
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

const { t } = useI18n();
const confirm = useConfirm();
const errorHandlingStore = useErrorHandlingStore();
const notificationStore = useNotificationStore();
const route = useRoute();
const router = useRouter();
const { fetchById: fetchPassportById } = useDigitalProductDocument(
  DigitalProductDocumentType.Passport,
);

// The passport this list is scoped to (from the nested route param).
const passportId = computed(() => String(route.params.passportId));

// -------------------------------------------------------------------------
// State
// -------------------------------------------------------------------------

const permalinks = ref<PermalinkPublicDto[]>([]);
const loading = ref(false);
const createGs1DialogVisible = ref(false);

// Deep link from the UPI table CTA: ?createForUpi=<uuid> auto-opens the
// create dialog with that UPI preselected (param is stripped after opening).
const preselectedUpiId = ref(
  route.query.createForUpi ? String(route.query.createForUpi) : undefined,
);

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
// Derived: presentation permalink count (for guarded delete)
// -------------------------------------------------------------------------

const presentationPermalinkCount = computed(
  () => permalinks.value.filter((pl) => pl.kind === PermalinkKind.PRESENTATION).length,
);

// -------------------------------------------------------------------------
// Passport status (drives the frozen-URLs info alert)
// -------------------------------------------------------------------------

// Read from the passport itself, never inferred from the rows: a permalink's
// publishedUrl is immutable once frozen, so an archived-then-restored (or
// legacy) passport keeps frozen rows while being a draft again. Creating a
// permalink must never make this view claim the passport was published.
const passportIsPublished = ref(false);

async function loadPassportStatus() {
  const passport = await fetchPassportById(passportId.value);
  passportIsPublished.value =
    passport?.lastStatusChange.currentStatus === DigitalProductDocumentStatusDto.Published;
}

// -------------------------------------------------------------------------
// Linkable GS1 UPIs (drive both the create button and the dialog's picker)
// -------------------------------------------------------------------------

const { upis, fetchUniqueProductIdentifiers } = useUniqueProductIdentifiers();

// ponytail: one big page instead of a cursor loop — server limit is uncapped
// and a passport's UPI count stays far below this in practice.
const UPI_PICKER_LIMIT = 1000;

// Fail-open: a failed load must never lock the create button, so the disabled
// state is only claimed once we actually know the passport's UPIs.
const upisLoaded = ref(false);

async function loadGs1Upis() {
  try {
    await fetchUniqueProductIdentifiers(passportId.value, { limit: UPI_PICKER_LIMIT });
    upisLoaded.value = true;
  } catch (e) {
    upisLoaded.value = false;
    errorHandlingStore.logErrorWithNotification(t("permalink.createGs1Link.loadFailed"), e);
  }
}

/**
 * Only GS1 UPIs without an existing gs1-link permalink can receive one —
 * OPEN_DPP_UUID rows are system-only and cannot be used as a gs1-link target,
 * and each UPI carries at most one gs1-link permalink (row's own summary).
 */
const linkableGs1Upis = computed(() =>
  upis.value.filter((upi) => upi.type === UniqueProductIdentifierType.GS1 && upi.permalink == null),
);

const createGs1Disabled = computed(() => upisLoaded.value && linkableGs1Upis.value.length === 0);

// -------------------------------------------------------------------------
// Create dialog
// -------------------------------------------------------------------------

// Refetch before opening — a UPI linked elsewhere since the last load must drop
// out of the picker (rows carry their own permalink summary).
async function openCreateGs1Dialog() {
  await loadGs1Upis();
  createGs1DialogVisible.value = true;
}

async function onPermalinkCreated(_permalink: PermalinkPublicDto) {
  createGs1DialogVisible.value = false;
  // Reload the UPIs too: linking the last free one has to disable the button.
  await Promise.all([reloadCurrentPage(), loadGs1Upis()]);
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
  // A failing status fetch must not block the list — fetchById already notified
  // the user, and the banner stays hidden rather than claiming a publication.
  // loadGs1Upis handles its own failure — the button then stays enabled.
  await Promise.all([loadPassportStatus().catch(() => undefined), nextPage(), loadGs1Upis()]);
  if (preselectedUpiId.value) {
    createGs1DialogVisible.value = true;
    changeQueryParams({ createForUpi: undefined });
  }
});
</script>

<template>
  <div>
    <ConfirmDialog />

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
          <!-- The title sits on the wrapper: a disabled <button> receives no
               pointer events, so a tooltip on the button itself never shows. -->
          <span
            :title="createGs1Disabled ? t('permalink.createGs1Link.noUpisAvailable') : undefined"
            data-testid="permalink-create-gs1-link-wrapper"
          >
            <Button
              :label="t('permalink.list.createGs1Link')"
              data-testid="permalink-create-gs1-link-btn"
              :disabled="createGs1Disabled"
              @click="openCreateGs1Dialog"
            />
          </span>
        </div>
      </template>

      <!-- Kind column -->
      <Column field="kind" :header="t('permalink.list.kind')">
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <span :data-testid="`permalink-kind-${data.id}`">
              {{ kindLabel(data.kind) }}
            </span>
            <!-- The star in the actions column is the affordance for *setting*
                 primary; this tag is what identifies the primary row. -->
            <Tag
              v-if="data.primary"
              severity="warn"
              icon="pi pi-star-fill"
              :data-testid="`permalink-primary-tag-${data.id}`"
            >
              {{ t("permalink.list.primary") }}
            </Tag>
          </div>
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

      <!-- Actions column -->
      <Column :header="t('common.actions')">
        <template #body="{ data }">
          <div class="flex gap-1">
            <!-- Show QR button (all rows) -->
            <Button
              icon="pi pi-qrcode"
              severity="info"
              :aria-label="t('common.qrCode')"
              :title="t('common.qrCode')"
              :data-testid="`permalink-show-qr-btn-${data.id}`"
              @click="openQrDialog(data)"
            />

            <!-- Edit button (all rows) -->
            <Button
              icon="pi pi-pencil"
              severity="primary"
              :aria-label="t('common.edit')"
              :title="t('common.edit')"
              :data-testid="`permalink-edit-btn-${data.id}`"
              @click="openEditDialog(data)"
            />

            <!-- Primary star (presentation rows only): filled amber + disabled when
                 primary, gray outline + clickable to set primary otherwise -->
            <Button
              v-if="data.kind === PermalinkKind.PRESENTATION"
              :icon="data.primary ? 'pi pi-star-fill' : 'pi pi-star'"
              :severity="data.primary ? 'warn' : 'secondary'"
              :disabled="data.primary"
              :aria-label="
                data.primary ? t('permalink.list.primary') : t('permalink.list.setPrimary')
              "
              :title="data.primary ? t('permalink.list.primary') : t('permalink.list.setPrimary')"
              :data-testid="`permalink-primary-btn-${data.id}`"
              @click="onSetPrimary(data)"
            />

            <!-- Delete button -->
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

    <!-- Create GS1 Link dialog -->
    <PermalinkCreateGs1LinkDialog
      v-model:visible="createGs1DialogVisible"
      :upis="linkableGs1Upis"
      :preselected-upi-id="preselectedUpiId"
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
      <PermalinkQrCode v-if="qrPermalink" :permalink="qrPermalink" />
    </Dialog>
  </div>
</template>
