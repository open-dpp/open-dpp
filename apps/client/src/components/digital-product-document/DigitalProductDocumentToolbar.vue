<script setup lang="ts">
import { DigitalProductDocumentStatusDto, type DigitalProductDocumentDto } from "@open-dpp/dto";
import type { Gs1IdentityResponse } from "@open-dpp/api-client";
import { useI18n } from "vue-i18n";
import { computed, ref, watch } from "vue";
import { isAxiosError } from "axios";
import {
  DigitalProductDocumentType,
  type DigitalProductDocumentTypeType,
} from "../../lib/digital-product-document.ts";
import { useDigitalProductDocument } from "../../composables/digital-product-document.ts";
import { useRouterUtils } from "../../composables/router-utils.ts";
import { useErrorHandlingStore } from "../../stores/error.handling.ts";
import apiClient from "../../lib/api-client.ts";
import PermalinkSettingsDialog from "./PermalinkSettingsDialog.vue";
import Gs1SettingsDialog from "./Gs1SettingsDialog.vue";
import Gs1QrCodeDialog from "./Gs1QrCodeDialog.vue";
import { useRoute, useRouter } from "vue-router";

const { t } = useI18n();

const model = defineModel<DigitalProductDocumentDto>({ required: true });

const props = defineProps<{
  type: DigitalProductDocumentTypeType;
}>();
const { goToParent } = useRouterUtils();
const { publish, archive, restore, deleteDPD, fetchById } = useDigitalProductDocument(props.type);
const errorHandlingStore = useErrorHandlingStore();
const route = useRoute();
const router = useRouter();

async function fetchDPD(id: string) {
  try {
    const data = await fetchById(id);
    if (data) {
      model.value = data;
    }
  } catch {}
}

const qrCodeDialogVisible = ref<boolean>(false);
const permalinkSettingsDialogVisible = ref<boolean>(false);
const gs1SettingsDialogVisible = ref<boolean>(false);
const gs1QrCodeDialogVisible = ref<boolean>(false);

// The passport's GS1 identity, if one exists. Loaded lazily for passports so the
// "GS1 QR code" dropdown action can be gated (a GS1 Data Carrier only exists once
// a GS1 identity has been assigned). `undefined` means "no GS1 identity".
const gs1Identity = ref<Gs1IdentityResponse | undefined>(undefined);
const hasGs1Identity = computed(() => gs1Identity.value !== undefined);

async function loadGs1Identity(passportId: string) {
  try {
    const result = await apiClient.dpp.passports.getGs1Identity(passportId);
    gs1Identity.value = result.data;
  } catch (e) {
    // A 404 means the passport has no GS1 identity yet. Any other error is treated
    // as non-fatal here: this is a best-effort gate for an optional dropdown action,
    // so we degrade gracefully (action disabled) without interrupting the user. The
    // visible-error paths live in the GS1 settings dialog and canonical resolution.
    gs1Identity.value = undefined;
    if (!(isAxiosError(e) && e.response?.status === 404)) {
      errorHandlingStore.logErrorWithNotification(t("gs1.qrCode.loadError"), e);
    }
  }
}

watch(
  () => (props.type === DigitalProductDocumentType.Passport ? model.value?.id : undefined),
  async (passportId) => {
    if (!passportId) {
      gs1Identity.value = undefined;
      return;
    }
    await loadGs1Identity(passportId);
  },
  { immediate: true },
);

function onGs1IdentityUpdated(identity: Gs1IdentityResponse) {
  gs1Identity.value = identity;
}

function onGs1IdentityRemoved() {
  gs1Identity.value = undefined;
}

async function onDeleteButtonClicked(item: DigitalProductDocumentDto) {
  await deleteDPD(item.id, async () => {
    await goToParent();
  });
}

async function onArchiveButtonClicked(item: DigitalProductDocumentDto) {
  await archive(item.id);
  await fetchDPD(item.id);
}

async function onRestoreButtonClicked(item: DigitalProductDocumentDto) {
  await restore(item.id);
  await fetchDPD(item.id);
}

async function onPublishButtonClicked(item: DigitalProductDocumentDto) {
  await publish(item.id);
  await fetchDPD(item.id);
}

async function navigateToActivityHistory() {
  await router.push(`${route.path}/activities`);
}

const status = computed(() => model.value?.lastStatusChange.currentStatus);

const permalinkActions = computed(() => [
  {
    label: t("permalink.settings.open"),
    icon: "pi pi-cog",
    command: () => {
      permalinkSettingsDialogVisible.value = true;
    },
  },
  {
    label: t("gs1.settings.open"),
    icon: "pi pi-barcode",
    command: () => {
      gs1SettingsDialogVisible.value = true;
    },
  },
  {
    label: t("gs1.qrCode.open"),
    icon: "pi pi-qrcode",
    disabled: !hasGs1Identity.value,
    command: () => {
      gs1QrCodeDialogVisible.value = true;
    },
  },
]);
</script>

<template>
  <div class="card">
    <Toolbar v-if="status && model">
      <template #start>
        <div class="flex gap-2">
          <Button
            v-if="status === DigitalProductDocumentStatusDto.Draft"
            icon="pi pi-trash"
            severity="danger"
            text
            :aria-label="t('common.remove')"
            v-tooltip.bottom="t('common.remove')"
            @click="onDeleteButtonClicked(model)"
          />
          <Button
            v-if="
              status === DigitalProductDocumentStatusDto.Draft ||
              status === DigitalProductDocumentStatusDto.Published
            "
            icon="pi pi-folder-open"
            severity="secondary"
            text
            :aria-label="t('status.archive')"
            v-tooltip.bottom="t('status.archive')"
            @click="onArchiveButtonClicked(model)"
          />
          <Button
            v-if="status === DigitalProductDocumentStatusDto.Archived"
            icon="pi pi-undo"
            severity="secondary"
            text
            :aria-label="t('status.restore')"
            v-tooltip.bottom="t('status.restore')"
            @click="onRestoreButtonClicked(model)"
          />
          <Button
            v-if="status === DigitalProductDocumentStatusDto.Draft"
            icon="pi pi-megaphone"
            text
            severity="secondary"
            :aria-label="t('status.publish')"
            v-tooltip.bottom="t('status.publish')"
            @click="onPublishButtonClicked(model)"
          />
          <Button
            icon="pi pi-history"
            text
            severity="secondary"
            :aria-label="t('activityHistory.label')"
            v-tooltip.bottom="t('activityHistory.label')"
            @click="navigateToActivityHistory"
          />
        </div>
      </template>
      <template #center>
        <Tag v-if="type === DigitalProductDocumentType.Passport" severity="contrast">{{
          t(`status.${status.toLowerCase()}`)
        }}</Tag>
      </template>
      <template #end>
        <div class="flex items-center gap-2">
          <SplitButton
            v-if="type === DigitalProductDocumentType.Passport"
            icon="pi pi-qrcode"
            severity="primary"
            :label="t('common.qrCode')"
            :model="permalinkActions"
            @click="qrCodeDialogVisible = true"
          />
          <Tag v-if="type === DigitalProductDocumentType.Template" severity="contrast">{{
            t(`status.${status.toLowerCase()}`)
          }}</Tag>
        </div>
      </template>
    </Toolbar>
  </div>
  <PassportQrCodeDialog
    v-if="type === DigitalProductDocumentType.Passport && model"
    v-model:visible="qrCodeDialogVisible"
    :passportId="model.id"
    :status="status"
    @publish="onPublishButtonClicked(model)"
  />
  <PermalinkSettingsDialog
    v-if="type === DigitalProductDocumentType.Passport && model"
    v-model:visible="permalinkSettingsDialogVisible"
    :passportId="model.id"
  />
  <Gs1SettingsDialog
    v-if="type === DigitalProductDocumentType.Passport && model"
    v-model:visible="gs1SettingsDialogVisible"
    :passportId="model.id"
    :status="status"
    @updated="onGs1IdentityUpdated"
    @removed="onGs1IdentityRemoved"
  />
  <Gs1QrCodeDialog
    v-if="type === DigitalProductDocumentType.Passport && model"
    v-model:visible="gs1QrCodeDialogVisible"
    :identity="gs1Identity"
  />
</template>
