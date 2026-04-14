<script setup lang="ts">
import Galleria from "primevue/galleria";
import { computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useAasGallery } from "../../composables/aas-gallery.ts";
import { useAasUtils } from "../../composables/aas-utils.ts";
import { useErrorHandlingStore } from "../../stores/error.handling.ts";
import { usePassportStore } from "../../stores/passport";
import { convertLocaleToLanguage } from "../../translations/i18n.ts";

const passportStore = usePassportStore();

const { t, locale } = useI18n();
const errorHandlingStore = useErrorHandlingStore();

const aasUtils = useAasUtils({
  translate: t,
  selectedLanguage: convertLocaleToLanguage(locale.value),
});

const { files, downloadDefaultThumbnails } = useAasGallery({
  translate: t,
  errorHandlingStore,
});

const firstShell = computed(() => {
  if (passportStore.shells && passportStore.shells.length > 0) {
    return passportStore.shells[0];
  }
  return undefined;
});

const displayName = computed(() =>
  firstShell.value ? aasUtils.parseDisplayNameFromAas(firstShell.value) : undefined,
);

const productPassport = computed(() => passportStore.productPassport);

const hasImages = computed(() => files.value !== undefined && files.value.length > 0);

const hasMultipleImages = computed(() => files.value !== undefined && files.value.length > 1);

watch(
  () => firstShell.value,
  async (newShell) => {
    if (newShell) {
      await downloadDefaultThumbnails(newShell);
    }
  },
  { immediate: true },
);
</script>

<template>
  <div id="product-details" class="flex flex-col gap-6">
    <!-- Image gallery -->
    <Galleria
      v-if="hasImages"
      :value="files"
      :show-thumbnails="false"
      :auto-play="hasMultipleImages"
      :show-item-navigators="hasMultipleImages"
      :show-item-navigators-on-hover="hasMultipleImages"
      :show-indicators="hasMultipleImages"
      :transition-interval="4000"
      :circular="true"
      class="w-full overflow-hidden rounded-xl"
    >
      <template #item="{ item }">
        <img
          :src="item.url"
          :alt="displayName ?? t('presentation.productDetails')"
          class="aspect-[16/9] w-full object-cover sm:aspect-[21/9]"
        />
      </template>
    </Galleria>

    <!-- General information card -->
    <div class="border-surface-200 bg-surface-0 rounded-xl border p-6 shadow-sm">
      <h3 class="text-surface-900 border-primary-500 mb-6 border-l-3 pl-4 text-lg font-semibold">
        {{ t("presentation.generalInformation") }}
      </h3>
      <dl class="grid grid-cols-1">
        <div v-if="displayName" class="border-surface-100 flex justify-between border-b py-4">
          <dt class="text-surface-500">
            {{ t("common.name") }}
          </dt>
          <dd class="text-surface-900 font-medium">
            {{ displayName }}
          </dd>
        </div>
        <div
          v-if="productPassport"
          class="border-surface-100 flex justify-between border-b py-4 last:border-b-0"
        >
          <dt class="text-surface-500">
            {{ t("common.id") }}
          </dt>
          <dd class="text-surface-900 font-mono text-sm">
            {{ productPassport.id }}
          </dd>
        </div>
      </dl>
    </div>
  </div>
</template>
