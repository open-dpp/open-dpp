<script setup lang="ts">
import { DigitalProductDocumentStatusDto, type DigitalProductDocumentDto } from "@open-dpp/dto";
import { useI18n } from "vue-i18n";
import { computed, ref, watch } from "vue";
import {
  DigitalProductDocumentType,
  type DigitalProductDocumentTypeType,
} from "../../lib/digital-product-document.ts";
import { useDigitalProductDocument } from "../../composables/digital-product-document.ts";
import { useRouterUtils } from "../../composables/router-utils.ts";

const { t } = useI18n();

const props = defineProps<{
  id: string;
  type: DigitalProductDocumentTypeType;
}>();
const { goToParent } = useRouterUtils();
const item = ref<DigitalProductDocumentDto>();
const { publish, archive, restore, deleteDPD, fetchById } = useDigitalProductDocument(props.type);

async function fetchDPD(id: string) {
  if (id) {
    item.value = await fetchById(id);
  }
}

watch(
  () => props.id,
  async (newValue) => {
    if (newValue) {
      await fetchDPD(newValue);
    } else {
      item.value = undefined;
    }
  },
  { immediate: true },
);

const qrCodeDialogVisible = ref<boolean>(false);

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

const status = computed(() => item.value?.lastStatusChange.currentStatus);
</script>

<template>
  <div class="card">
    <Toolbar v-if="status && item">
      <template #start>
        <div class="flex gap-2">
          <Button
            v-if="status === DigitalProductDocumentStatusDto.Draft"
            icon="pi pi-trash"
            severity="danger"
            text
            :aria-label="t('common.remove')"
            v-tooltip.bottom="t('common.remove')"
            @click="onDeleteButtonClicked(item)"
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
            @click="onArchiveButtonClicked(item)"
          />
          <Button
            v-if="status === DigitalProductDocumentStatusDto.Archived"
            icon="pi pi-undo"
            severity="secondary"
            text
            :aria-label="t('status.restore')"
            v-tooltip.bottom="t('status.restore')"
            @click="onRestoreButtonClicked(item)"
          />
          <Button
            v-if="status === DigitalProductDocumentStatusDto.Draft"
            icon="pi pi-megaphone"
            text
            severity="secondary"
            :aria-label="t('status.publish')"
            v-tooltip.bottom="t('status.publish')"
            @click="onPublishButtonClicked(item)"
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
          <Button
            v-if="type === DigitalProductDocumentType.Passport"
            icon="pi pi-qrcode"
            severity="primary"
            :label="t('common.qrCode')"
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
    v-if="type === DigitalProductDocumentType.Passport && item"
    v-model:visible="qrCodeDialogVisible"
    :passportId="item.id"
  />
</template>

<style scoped></style>
