<script setup lang="ts">
import { DigitalProductDocumentStatusDto, type DigitalProductDocumentDto } from "@open-dpp/dto";
import { useI18n } from "vue-i18n";
import { AasEditMode, type AasEditModeType } from "../../lib/aas-editor.ts";
import { computed, ref } from "vue";

const { t } = useI18n();

const props = defineProps<{
  dppItem: DigitalProductDocumentDto | null;
  editorMode: AasEditModeType;
}>();

const emits = defineEmits<{
  (e: "onDeleteClicked", item: DigitalProductDocumentDto): void;
  (e: "onPublishClicked", item: DigitalProductDocumentDto): void;
  (e: "onArchiveClicked", item: DigitalProductDocumentDto): void;
  (e: "onRestoreClicked", item: DigitalProductDocumentDto): void;
}>();
const qrCodeDialogVisible = ref<boolean>(false);

const status = computed(() => props.dppItem?.lastStatusChange.currentStatus);
</script>

<template>
  <div class="card">
    <Toolbar v-if="status && props.dppItem">
      <template #start>
        <div class="flex gap-2">
          <Button
            v-if="status === DigitalProductDocumentStatusDto.Draft"
            icon="pi pi-trash"
            severity="danger"
            text
            :aria-label="t('common.remove')"
            v-tooltip.bottom="t('common.remove')"
            @click="emits('onDeleteClicked', props.dppItem)"
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
            @click="emits('onArchiveClicked', props.dppItem)"
          />
          <Button
            v-if="status === DigitalProductDocumentStatusDto.Archived"
            icon="pi pi-undo"
            severity="secondary"
            text
            :aria-label="t('status.restore')"
            v-tooltip.bottom="t('status.restore')"
            @click="emits('onRestoreClicked', props.dppItem)"
          />
          <Button
            v-if="status === DigitalProductDocumentStatusDto.Draft"
            icon="pi pi-megaphone"
            text
            severity="secondary"
            :aria-label="t('status.publish')"
            v-tooltip.bottom="t('status.publish')"
            @click="emits('onPublishClicked', props.dppItem)"
          />
        </div>
      </template>
      <template #center>
        <Tag v-if="editorMode === AasEditMode.Passport" severity="contrast">{{
          t(`status.${status.toLowerCase()}`)
        }}</Tag>
      </template>
      <template #end>
        <div class="flex items-center gap-2">
          <Button
            v-if="editorMode === AasEditMode.Passport"
            icon="pi pi-qrcode"
            severity="primary"
            :label="t('common.qrCode')"
            @click="qrCodeDialogVisible = true"
          />
          <Tag v-if="editorMode === AasEditMode.Template" severity="contrast">{{
            t(`status.${status.toLowerCase()}`)
          }}</Tag>
        </div>
      </template>
    </Toolbar>
  </div>
  <PassportQrCodeDialog
    v-if="editorMode === AasEditMode.Passport && props.dppItem"
    v-model:visible="qrCodeDialogVisible"
    :passportId="props.dppItem.id"
  />
</template>

<style scoped></style>
