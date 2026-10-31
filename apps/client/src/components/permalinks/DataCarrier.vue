<script lang="ts" setup>
import {
  CarrierExportFormat,
  type CarrierExportFormatType,
  formatGs1ElementString,
  PermalinkKind,
  type PermalinkKindType,
} from "@open-dpp/dto";
import { useClipboard } from "@vueuse/core";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import apiClient from "../../lib/api-client";
import { downloadBlob } from "../../lib/download";
import { useErrorHandlingStore } from "../../stores/error.handling";
import { useNotificationStore } from "../../stores/notification";

const props = withDefaults(
  defineProps<{
    permalink: { id: string; kind: PermalinkKindType; publicUrl: string; slug?: string | null };
    identity?: { gtin: string; batch?: string | null; serial?: string | null } | null;
    /** Draws the code as large as the screen allows, for scanning it right off the screen. */
    presentation?: boolean;
  }>(),
  { identity: null, presentation: false },
);

const { t } = useI18n();
const notificationStore = useNotificationStore();
const { logErrorWithNotification } = useErrorHandlingStore();
const { copy } = useClipboard();

const imageUrl = ref<string | null>(null);
const loadFailed = ref(false);
const downloading = ref<CarrierExportFormatType | null>(null);
let latestLoad = 0;

const isGs1Link = computed(() => props.permalink.kind === PermalinkKind.GS1_LINK);

const url = computed(() => props.permalink.publicUrl);

const urlLabel = computed(() =>
  isGs1Link.value ? t("dataCarrier.digitalLink.label") : t("permalink.list.publicUrl"),
);

const elementString = computed<string | undefined>(() => {
  if (!isGs1Link.value || !props.identity) return undefined;
  const { gtin, batch, serial } = props.identity;
  if (!gtin) return undefined;
  try {
    return formatGs1ElementString({ gtin, batch, serial });
  } catch {
    return undefined;
  }
});

function releaseImage() {
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value);
    imageUrl.value = null;
  }
}

async function loadImage(permalinkId: string) {
  const load = ++latestLoad;
  loadFailed.value = false;
  try {
    const response = await apiClient.dpp.permalinks.getCarrierExport(permalinkId, {
      format: CarrierExportFormat.SVG,
    });
    if (load !== latestLoad) return;
    releaseImage();
    imageUrl.value = URL.createObjectURL(new Blob([response.data], { type: "image/svg+xml" }));
  } catch (error) {
    if (load !== latestLoad) return;
    releaseImage();
    loadFailed.value = true;
    logErrorWithNotification(t("dataCarrier.loadError"), error);
  }
}

watch(
  () => [props.permalink.id, props.permalink.publicUrl] as const,
  ([permalinkId]) => loadImage(permalinkId),
  { immediate: true },
);

onBeforeUnmount(() => {
  latestLoad++;
  releaseImage();
});

async function onDownload(format: CarrierExportFormatType) {
  downloading.value = format;
  try {
    const response = await apiClient.dpp.permalinks.getCarrierExport(props.permalink.id, {
      format,
    });
    downloadBlob(
      response.data,
      `data-carrier-${props.permalink.slug ?? props.permalink.id}.${format}`,
    );
  } catch (error) {
    logErrorWithNotification(t("dataCarrier.downloadError"), error);
  } finally {
    downloading.value = null;
  }
}

async function onCopy() {
  if (!url.value) return;
  await copy(url.value);
  notificationStore.addSuccessNotification(t("common.clipboardSuccess"));
}
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <div :class="presentation ? 'w-full max-w-[55vmin]' : 'w-64 max-w-full'">
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="t('dataCarrier.image.alt', { url })"
        data-testid="data-carrier-image"
        class="block aspect-square h-auto w-full"
      />
      <div
        v-else-if="loadFailed"
        data-testid="data-carrier-load-error"
        class="flex aspect-square w-full items-center justify-center rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500"
      >
        {{ t("dataCarrier.loadError") }}
      </div>
      <div v-else class="aspect-square w-full animate-pulse rounded-lg bg-gray-100" />
    </div>

    <div v-if="elementString" class="flex w-full flex-col gap-1">
      <span class="text-xs font-medium tracking-wider text-gray-500 uppercase">
        {{ t("dataCarrier.elementString.label") }}
      </span>
      <span
        data-testid="permalink-qr-element-string"
        class="font-mono text-sm break-all text-gray-900"
      >
        {{ elementString }}
      </span>
    </div>

    <div v-if="url" class="flex w-full flex-col gap-1">
      <span class="text-xs font-medium tracking-wider text-gray-500 uppercase">
        {{ urlLabel }}
      </span>
      <a
        :href="url"
        target="_blank"
        rel="noopener noreferrer"
        data-testid="permalink-qr-url"
        class="font-mono text-sm break-all text-blue-600"
      >
        {{ url }}
      </a>
    </div>

    <div class="flex flex-wrap justify-center gap-2">
      <Button
        :label="t('common.copy')"
        data-testid="permalink-qr-copy-btn"
        variant="outlined"
        severity="secondary"
        :disabled="!url"
        @click="onCopy"
      />
      <Button
        :label="t('dataCarrier.download.svg')"
        icon="pi pi-download"
        data-testid="data-carrier-download-svg"
        severity="secondary"
        :loading="downloading === CarrierExportFormat.SVG"
        :disabled="downloading !== null"
        @click="onDownload(CarrierExportFormat.SVG)"
      />
      <Button
        :label="t('dataCarrier.download.png')"
        icon="pi pi-download"
        data-testid="data-carrier-download-png"
        severity="secondary"
        :loading="downloading === CarrierExportFormat.PNG"
        :disabled="downloading !== null"
        @click="onDownload(CarrierExportFormat.PNG)"
      />
    </div>
  </div>
</template>
