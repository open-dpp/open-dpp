<script lang="ts" setup>
import type { PermalinkPublicDto } from "@open-dpp/api-client";
import { formatGs1ElementString, PermalinkKind } from "@open-dpp/dto";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useClipboard } from "@vueuse/core";
import { useNotificationStore } from "../../stores/notification";

const props = defineProps<{
  permalink: PermalinkPublicDto;
  identity?: { gtin: string; batch?: string | null; serial?: string | null } | null;
}>();

const { t } = useI18n();
const notificationStore = useNotificationStore();
const { copy } = useClipboard();

/**
 * Whether this permalink is a GS1-link permalink (vs. a presentation permalink).
 * Only GS1-link permalinks have a QR code to show.
 */
const isGs1Link = computed(() => props.permalink.kind === PermalinkKind.GS1_LINK);

/**
 * The GS1 Digital Link — the full URL including the path and query string.
 * For a gs1-link permalink the backend provides it as `publicUrl`.
 */
const digitalLink = computed<string | undefined>(() => {
  if (!isGs1Link.value) return undefined;
  return props.permalink.publicUrl;
});

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
  if (!digitalLink.value) return;
  await copy(digitalLink.value);
  notificationStore.addSuccessNotification(t("common.clipboardSuccess"));
}
</script>

<template>
  <div>
    <!-- GS1-link: show QR + element string + copy -->
    <template v-if="isGs1Link">
      <div class="flex flex-col items-center gap-4">
        <QrCode v-if="digitalLink" :link="digitalLink" :size="256" />

        <div v-if="elementString" class="flex w-full flex-col gap-1">
          <span class="text-xs font-medium tracking-wider text-gray-500 uppercase">
            {{ t("gs1LinkQrCode.elementString.label") }}
          </span>
          <span
            data-testid="gs1-link-qr-element-string"
            class="font-mono text-sm break-all text-gray-900"
          >
            {{ elementString }}
          </span>
        </div>

        <div v-if="digitalLink" class="flex w-full flex-col gap-1">
          <span class="text-xs font-medium tracking-wider text-gray-500 uppercase">
            {{ t("gs1LinkQrCode.digitalLink.label") }}
          </span>
          <a
            :href="digitalLink"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="gs1-link-qr-digital-link"
            class="font-mono text-sm break-all text-blue-600"
          >
            {{ digitalLink }}
          </a>
        </div>

        <Button
          :label="t('common.copy')"
          data-testid="gs1-link-qr-copy-btn"
          variant="outlined"
          severity="secondary"
          :disabled="!digitalLink"
          @click="onCopy"
        />
      </div>
    </template>

    <!-- Presentation permalink: empty/N-A state -->
    <div v-else data-testid="gs1-link-qr-empty" class="text-sm text-gray-500">
      {{ t("gs1LinkQrCode.empty") }}
    </div>
  </div>
</template>
