<script lang="ts" setup>
import {
  CARRIER_EXPORT_CONTENT_TYPES,
  CarrierExportFormat,
  type CarrierExportFormatType,
  formatGs1ElementString,
  PermalinkKind,
  type PermalinkKindType,
} from "@open-dpp/dto";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import apiClient from "../../lib/api-client";
import { downloadBlob, fileNameFromContentDisposition } from "../../lib/download";
import { useErrorHandlingStore } from "../../stores/error.handling";
import { useNotificationStore } from "../../stores/notification";

const props = withDefaults(
  defineProps<{
    permalink: { id: string; kind: PermalinkKindType; publicUrl: string };
    identity?: { gtin: string; batch?: string | null; serial?: string | null } | null;
    /** Draws the code as large as the screen allows, for scanning it right off the screen. */
    presentation?: boolean;
  }>(),
  { identity: null, presentation: false },
);

const { t } = useI18n();
const notificationStore = useNotificationStore();
const { logErrorWithNotification } = useErrorHandlingStore();

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
  } catch (error) {
    console.error("Cannot format the GS1 element string", error);
    return undefined;
  }
});

function releaseImage() {
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value);
    imageUrl.value = null;
  }
}

/** Shows the Data Carrier, drawn from the permalink's Carrier Export at the default settings. */
async function showDataCarrier(permalinkId: string) {
  const load = ++latestLoad;
  // The old carrier encodes the old URL; never show it next to the new one
  releaseImage();
  loadFailed.value = false;
  try {
    const response = await apiClient.dpp.permalinks.getCarrierExport(permalinkId, {
      format: CarrierExportFormat.SVG,
    });
    if (load !== latestLoad) return;
    releaseImage();
    imageUrl.value = URL.createObjectURL(
      new Blob([response.data], { type: CARRIER_EXPORT_CONTENT_TYPES[CarrierExportFormat.SVG] }),
    );
  } catch (error) {
    if (load !== latestLoad) return;
    releaseImage();
    loadFailed.value = true;
    logErrorWithNotification(t("dataCarrier.loadError"), error);
  }
}

watch(
  () => [props.permalink.id, props.permalink.publicUrl] as const,
  ([permalinkId]) => showDataCarrier(permalinkId),
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
      fileNameFromContentDisposition(response.headers["content-disposition"]) ??
        `data-carrier.${format}`,
    );
  } catch (error) {
    logErrorWithNotification(t("dataCarrier.downloadError"), error);
  } finally {
    downloading.value = null;
  }
}

async function onCopy() {
  if (!url.value) return;
  try {
    // Throws when the Clipboard API is missing and rejects when the write is denied
    await navigator.clipboard.writeText(url.value);
    notificationStore.addSuccessNotification(t("common.clipboardSuccess"));
  } catch (error) {
    logErrorWithNotification(t("dataCarrier.copyError"), error);
  }
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
        class="border-rule text-ink-muted flex aspect-square w-full items-center justify-center rounded-lg border border-dashed p-4 text-center text-sm"
      >
        {{ t("dataCarrier.loadError") }}
      </div>
      <div v-else class="bg-rule aspect-square w-full animate-pulse rounded-lg" />
    </div>

    <div v-if="elementString" class="flex w-full flex-col gap-1">
      <span class="text-ink-muted text-xs font-semibold">
        {{ t("dataCarrier.elementString.label") }}
      </span>
      <span data-testid="data-carrier-element-string" class="text-ink font-mono text-sm break-all">
        {{ elementString }}
      </span>
    </div>

    <div v-if="url" class="flex w-full flex-col gap-1">
      <span class="text-ink-muted text-xs font-semibold">
        {{ urlLabel }}
      </span>
      <a
        :href="url"
        target="_blank"
        rel="noopener noreferrer"
        data-testid="data-carrier-url"
        class="text-primary-600 hover:text-primary-500 font-mono text-sm break-all"
      >
        {{ url }}
      </a>
    </div>

    <div class="flex flex-wrap justify-center gap-2">
      <Button
        :label="t('common.copy')"
        data-testid="data-carrier-copy-btn"
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
