<script lang="ts" setup>
import { CarrierExportFormat } from "@open-dpp/dto";
import { useI18n } from "vue-i18n";
import {
  type DataCarrierIdentity,
  type DataCarrierPermalink,
  useDataCarrier,
} from "../../composables/data-carrier.ts";

const props = withDefaults(
  defineProps<{
    permalink: DataCarrierPermalink;
    identity?: DataCarrierIdentity | null;
    /** Draws the code as large as the screen allows, for scanning it right off the screen. */
    presentation?: boolean;
  }>(),
  { identity: null, presentation: false },
);

const { t } = useI18n();
const { imageUrl, loadFailed, downloading, url, urlLabel, elementString, download, copyUrl } =
  useDataCarrier(
    () => props.permalink,
    () => props.identity,
  );
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
        @click="copyUrl"
      />
      <Button
        :label="t('dataCarrier.download.svg')"
        icon="pi pi-download"
        data-testid="data-carrier-download-svg"
        severity="secondary"
        :loading="downloading === CarrierExportFormat.SVG"
        :disabled="downloading !== null"
        @click="download(CarrierExportFormat.SVG)"
      />
      <Button
        :label="t('dataCarrier.download.png')"
        icon="pi pi-download"
        data-testid="data-carrier-download-png"
        severity="secondary"
        :loading="downloading === CarrierExportFormat.PNG"
        :disabled="downloading !== null"
        @click="download(CarrierExportFormat.PNG)"
      />
    </div>
  </div>
</template>
