<script lang="ts" setup>
import type { Gs1IdentityResponse } from "@open-dpp/api-client";
import { formatGs1ElementString } from "@open-dpp/dto";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useClipboard, useWindowSize } from "@vueuse/core";
import { useNotificationStore } from "../../stores/notification";

const model = defineModel<boolean>("visible");
const props = defineProps<{
  identity: Gs1IdentityResponse | undefined;
}>();

const { t } = useI18n();
const notificationStore = useNotificationStore();
const { width: windowWidth, height: windowHeight } = useWindowSize();
const { copy } = useClipboard();

const digitalLink = computed(() => props.identity?.digitalLink);
const qrSize = computed(() => Math.min(windowHeight.value, windowWidth.value) * 0.5);

/**
 * The human-readable GS1 element string, e.g. `(01) … (10) … (21) …`. Built from
 * the shared formatter; if the (already-validated) identity somehow fails to
 * format, fall back to no element string rather than throwing in the template.
 */
const elementString = computed<string | undefined>(() => {
  if (!props.identity) return undefined;
  try {
    return formatGs1ElementString({
      gtin: props.identity.gtin,
      batch: props.identity.batch,
      serial: props.identity.serial,
    });
  } catch {
    return undefined;
  }
});

async function onCopy() {
  if (!digitalLink.value) return;
  await copy(digitalLink.value);
  notificationStore.addSuccessNotification(t("common.clipboardSuccess"));
}
</script>

<template>
  <Dialog
    v-model:visible="model"
    modal
    :header="t('gs1.qrCode.title')"
    class="w-full md:w-2/3 xl:w-1/2"
  >
    <div v-if="identity" class="flex flex-col items-center gap-4">
      <QrCode v-if="digitalLink" :size="qrSize" :link="digitalLink" />

      <div v-if="elementString" class="flex w-full flex-col gap-1">
        <span class="text-xs font-medium tracking-wider text-gray-500 uppercase">{{
          t("gs1.qrCode.elementString.label")
        }}</span>
        <span data-testid="gs1-qr-element-string" class="font-mono text-sm break-all text-gray-900">
          {{ elementString }}
        </span>
      </div>

      <div v-if="digitalLink" class="flex w-full flex-col gap-1">
        <span class="text-xs font-medium tracking-wider text-gray-500 uppercase">{{
          t("gs1.qrCode.digitalLink.label")
        }}</span>
        <a
          :href="digitalLink"
          target="_blank"
          rel="noopener noreferrer"
          data-testid="gs1-qr-digital-link"
          class="font-mono text-sm break-all text-blue-600"
        >
          {{ digitalLink }}
        </a>
      </div>
    </div>
    <div v-else class="text-sm text-gray-500" data-testid="gs1-qr-empty">
      {{ t("gs1.qrCode.empty") }}
    </div>

    <template #footer>
      <Button
        :label="t('common.copy')"
        data-testid="gs1-qr-copy-btn"
        variant="outlined"
        severity="secondary"
        :disabled="!digitalLink"
        @click="onCopy"
        autofocus
      />
    </template>
  </Dialog>
</template>
