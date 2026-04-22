<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import AASEditor from "../../components/aas/AASEditor.vue";
import { DigitalProductDocumentType } from "../../lib/digital-product-document.ts";
import { useDigitalProductDocument } from "../../composables/digital-product-document.ts";
import type { DigitalProductDocumentDto } from "@open-dpp/dto";

type ViewStatus = "loading" | "ready" | "not-found" | "error";

const { t } = useI18n();
const route = useRoute();
const id = computed(() => (route.params.passportId ? String(route.params.passportId) : undefined));
const { fetchById } = useDigitalProductDocument(DigitalProductDocumentType.Passport);
const item = ref<DigitalProductDocumentDto>();
const status = ref<ViewStatus>("loading");

async function load(targetId: string | undefined, isStale: () => boolean) {
  if (!targetId) {
    item.value = undefined;
    status.value = "loading";
    return;
  }
  status.value = "loading";
  const result = await fetchById(targetId);
  if (isStale()) return;
  if (result.status === "ok") {
    item.value = result.data;
    status.value = "ready";
    return;
  }
  item.value = undefined;
  status.value = result.status === "not-found" ? "not-found" : "error";
}

watch(
  () => id.value,
  async (newValue, _old, onCleanup) => {
    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
    });
    await load(newValue, () => cancelled);
  },
  { immediate: true },
);

async function retry() {
  await load(id.value, () => false);
}
</script>

<template>
  <section
    class="flex flex-col gap-3 p-4 md:p-6"
    :aria-busy="status === 'loading'"
    aria-labelledby="passport-view-heading"
  >
    <h1 id="passport-view-heading" class="sr-only">{{ t("passports.label", 1) }}</h1>

    <div v-if="status === 'loading'" role="status" aria-live="polite" class="flex flex-col gap-3">
      <span class="sr-only">{{ t("passports.loading") }}</span>
      <div aria-hidden="true" class="bg-surface-100 h-14 animate-pulse rounded-xl"></div>
      <div
        aria-hidden="true"
        class="bg-surface-100 h-[calc(100dvh-var(--layout-header-h,64px)-5rem)] min-h-[16rem] animate-pulse rounded-xl"
      ></div>
    </div>

    <div
      v-else-if="status === 'not-found'"
      role="alert"
      class="border-surface-200 bg-surface-0 rounded-xl border p-6 shadow-sm"
    >
      <h2 class="text-lg font-semibold">{{ t("passports.notFoundTitle") }}</h2>
      <p class="text-surface-600 mt-2">{{ t("passports.notFoundDescription") }}</p>
    </div>

    <div
      v-else-if="status === 'error'"
      role="alert"
      class="border-surface-200 bg-surface-0 rounded-xl border p-6 shadow-sm"
    >
      <h2 class="text-lg font-semibold">{{ t("common.errorOccurred") }}</h2>
      <p class="text-surface-600 mt-2">{{ t("passports.errorLoading") }}</p>
      <Button class="mt-4" severity="secondary" :label="t('common.tryAgain')" @click="retry" />
    </div>

    <template v-else-if="status === 'ready' && item">
      <DigitalProductDocumentToolbar v-model="item" :type="DigitalProductDocumentType.Passport" />
      <AASEditor
        v-model="item"
        class="h-[calc(100dvh-var(--layout-header-h,64px))]"
        :type="DigitalProductDocumentType.Passport"
      />
    </template>
  </section>
</template>
