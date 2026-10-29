<script lang="ts" setup>
import type { PermalinkPublicDto } from "@open-dpp/api-client";
import {
  DigitalProductDocumentStatusDto,
  type DigitalProductDocumentStatusDtoType,
} from "@open-dpp/dto";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import apiClient from "../../lib/api-client";
import DataCarrier from "../permalinks/DataCarrier.vue";

const model = defineModel<boolean>("visible");
const props = defineProps<{
  passportId: string | undefined;
  status?: DigitalProductDocumentStatusDtoType;
}>();
const emit = defineEmits<{ (e: "publish"): void }>();
const permalinks = ref<PermalinkPublicDto[] | undefined>(undefined);
const { t } = useI18n();

const isDraft = computed(() => props.status === DigitalProductDocumentStatusDto.Draft);
const isArchived = computed(() => props.status === DigitalProductDocumentStatusDto.Archived);

watch(
  [() => props.passportId, model],
  async ([passportId, visible]) => {
    if (!passportId || !visible) return;
    const result = await apiClient.dpp.permalinks.getByPassport(String(passportId));
    permalinks.value = result.data;
  },
  { immediate: true },
);

const permalink = computed(() => permalinks.value?.at(-1));
</script>

<template>
  <Dialog
    ref="el"
    v-model:visible="model"
    modal
    maximizable
    :header="t('common.presentationMode')"
    class="xs:w-full h-5/6 w-2/3"
  >
    <div class="flex flex-col items-center gap-4">
      <div
        v-if="isDraft"
        class="flex w-full flex-row items-center gap-3 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-yellow-800"
      >
        <span class="flex-1 text-sm">{{ t("qrCodeDialog.draftWarning") }}</span>
        <Button
          data-testid="qr-publish-btn"
          :label="t('qrCodeDialog.publishAction')"
          severity="warning"
          size="small"
          @click="emit('publish')"
        />
      </div>
      <div
        v-else-if="isArchived"
        class="flex w-full flex-row items-center gap-3 rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-700"
      >
        <span class="flex-1 text-sm">{{ t("qrCodeDialog.archivedWarning") }}</span>
      </div>
      <DataCarrier v-if="permalink" :permalink="permalink" presentation />
      <div v-else class="flex w-full flex-col items-center justify-center gap-5 p-10">
        <span>
          {{ t("permalink.notfound") }}
        </span>
      </div>
    </div>
  </Dialog>
</template>
