<script lang="ts" setup>
import type { PermalinkPublicDto } from "@open-dpp/api-client";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import apiClient from "../../lib/api-client";
import { ArrowTopRightOnSquareIcon } from "@heroicons/vue/16/solid";
import { useClipboard, useWindowSize } from "@vueuse/core";
import { useToast } from "primevue/usetoast";

const model = defineModel<boolean>("visible");
const props = defineProps<{ passportId: string | undefined }>();
const permalinks = ref<PermalinkPublicDto[] | undefined>(undefined);
const { t } = useI18n();

// Refetch on every open (in addition to initial mount) so edits made via
// PermalinkSettingsDialog propagate without forcing the user to re-navigate.
// Watching both inputs keeps the dialog in sync if either the passport
// changes or the user closes + reopens after an edit.
watch(
  [() => props.passportId, model],
  async ([passportId, visible]) => {
    if (!passportId || !visible) return;
    const result = await apiClient.dpp.permalinks.getByPassport(String(passportId));
    permalinks.value = result.data;
  },
  { immediate: true },
);

const toast = useToast();

// `publicUrl` is the server-resolved white-label URL — falls back through
// permalink override → org branding → OPEN_DPP_URL so the QR encodes
// whatever the org has configured without the client duplicating that chain.
const link = computed(() => permalinks.value?.[0]?.publicUrl);

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
        v-if="!permalinks || !permalinks[0]"
        class="flex w-full flex-col items-center justify-center gap-5 p-10"
      >
        <span>
          {{ t("permalink.notfound") }}
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
