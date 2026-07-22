<script lang="ts" setup>
import { formatGs1ElementString, PermalinkKind, type PermalinkKindType } from "@open-dpp/dto";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useClipboard } from "@vueuse/core";
import { useNotificationStore } from "../../stores/notification";

const props = defineProps<{
  // Minimal permalink shape this component actually reads; callers may pass a
  // full PermalinkPublicDto or assemble the two fields from other row data.
  permalink: { kind: PermalinkKindType; publicUrl: string };
  identity?: { gtin: string; batch?: string | null; serial?: string | null } | null;
}>();

const { t } = useI18n();
const notificationStore = useNotificationStore();
const { copy } = useClipboard();

/**
 * Whether this permalink is a GS1-link permalink (vs. a presentation permalink).
 * Gates only the GS1-specific extras (element string, "GS1 Digital Link" caption);
 * the QR itself renders for every kind.
 */
const isGs1Link = computed(() => props.permalink.kind === PermalinkKind.GS1_LINK);

/**
 * The URL the QR encodes — the permalink's public URL. For a gs1-link permalink
 * this is the full GS1 Digital Link; for a presentation permalink the public
 * presentation URL.
 */
const url = computed(() => props.permalink.publicUrl);

const urlLabel = computed(() =>
  isGs1Link.value ? t("permalinkQrCode.digitalLink.label") : t("permalink.list.publicUrl"),
);

/**
 * The human-readable GS1 element string, e.g. `(01) … (10) … (21) …`.
 * Built from the shared formatter. Falls back to undefined if no identity is
 * provided or if the identity somehow fails to format (e.g. invalid GTIN).
 */
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

async function onCopy() {
  if (!url.value) return;
  await copy(url.value);
  notificationStore.addSuccessNotification(t("common.clipboardSuccess"));
}
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <QrCode v-if="url" :link="url" :size="256" />

    <div v-if="elementString" class="flex w-full flex-col gap-1">
      <span class="text-xs font-medium tracking-wider text-gray-500 uppercase">
        {{ t("permalinkQrCode.elementString.label") }}
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

    <Button
      :label="t('common.copy')"
      data-testid="permalink-qr-copy-btn"
      variant="outlined"
      severity="secondary"
      :disabled="!url"
      @click="onCopy"
    />
  </div>
</template>
