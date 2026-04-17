<script lang="ts" setup>
import type { UniqueProductIdentifierDto } from "@open-dpp/api-client";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { VIEW_ROOT_URL } from "../../const";
import apiClient from "../../lib/api-client";
import { ArrowTopRightOnSquareIcon } from "@heroicons/vue/16/solid";
import { useClipboard, useWindowSize } from "@vueuse/core";
import { useToast } from "primevue/usetoast";

const model = defineModel<boolean>();
const props = defineProps<{ passportId: string | undefined }>();
const upids = ref<UniqueProductIdentifierDto[] | undefined>(undefined);
const { t } = useI18n();

watch(
  () => props.passportId,
  async (newValue) => {
    if (newValue) {
      const result = await apiClient.dpp.uniqueProductIdentifiers.getByReference(
        String(props.passportId),
      );

      upids.value = result.data;
    }
  },
  { immediate: true },
);

const toast = useToast();

const link = computed(() =>
  upids.value && upids.value[0]
    ? `${VIEW_ROOT_URL}/presentation/${upids.value[0].uuid}`
    : undefined,
);

const { width: windowWidth, height: windowHeight } = useWindowSize();
const { copy } = useClipboard();

async function onCopy() {
  if (link.value) {
    await copy(link.value); // copies source.value
    toast.add({ severity: "success", summary: t("common.clipboardSuccess"), life: 3000 });
  }
}
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
      <QrCode :size="Math.min(windowHeight, windowWidth) * 0.55" v-if="link" :link="link" />
      <div v-if="link" class="flex flex-row gap-1 px-4 py-4 text-blue-600 sm:px-6">
        <a
          :href="link"
          target="_blank"
          rel="noopener noreferrer"
          class="mt-2 text-xl font-semibold"
        >
          {{ link }}
        </a>
        <ArrowTopRightOnSquareIcon class="mt-auto w-5" />
      </div>
      <div
        v-if="!upids || !upids[0]"
        class="flex w-full flex-col items-center justify-center gap-5 p-10"
      >
        <span>
          {{ t("uniqueproductidentifier.notfound") }}
        </span>
      </div>
    </div>
    <template #footer>
      <Button
        :label="t('common.copy')"
        variant="outlined"
        severity="secondary"
        @click="onCopy"
        autofocus
      />
    </template>
  </Dialog>
</template>
