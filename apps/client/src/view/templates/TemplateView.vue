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
const id = computed(() => (route.params.templateId ? String(route.params.templateId) : undefined));
const { fetchById } = useDigitalProductDocument(DigitalProductDocumentType.Template);
const item = ref<DigitalProductDocumentDto>();
const status = ref<ViewStatus>("loading");

let latestRequestId = 0;

async function load(targetId: string | undefined) {
  const requestId = ++latestRequestId;
  const isStale = () => requestId !== latestRequestId;
  if (!targetId) {
    item.value = undefined;
    status.value = "loading";
    return;
  }
  status.value = "loading";
  try {
    const data = await fetchById(targetId);
    if (isStale()) return;
    if (data === null) {
      item.value = undefined;
      status.value = "not-found";
      return;
    }
    item.value = data;
    status.value = "ready";
  } catch {
    if (isStale()) return;
    item.value = undefined;
    status.value = "error";
  }
}

watch(() => id.value, load, { immediate: true });

async function retry() {
  await load(id.value);
}
</script>

<template>
  <section
    class="flex flex-col gap-3 p-4 md:p-6"
    :aria-busy="status === 'loading'"
    aria-labelledby="template-view-heading"
  >
    <h1 id="template-view-heading" class="sr-only">{{ t("templates.label", 1) }}</h1>

    <div v-if="status === 'loading'" role="status" aria-live="polite" class="flex flex-col gap-3">
      <span class="sr-only">{{ t("templates.loading") }}</span>
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
      <h2 class="text-lg font-semibold">{{ t("templates.notFoundTitle") }}</h2>
      <p class="text-surface-600 mt-2">{{ t("templates.notFoundDescription") }}</p>
    </div>

    <div
      v-else-if="status === 'error'"
      role="alert"
      class="border-surface-200 bg-surface-0 rounded-xl border p-6 shadow-sm"
    >
      <h2 class="text-lg font-semibold">{{ t("common.errorOccurred") }}</h2>
      <p class="text-surface-600 mt-2">{{ t("templates.errorLoading") }}</p>
      <Button class="mt-4" severity="secondary" :label="t('common.tryAgain')" @click="retry" />
    </div>

    <template v-else-if="status === 'ready' && item">
      <DigitalProductDocumentToolbar v-model="item" :type="DigitalProductDocumentType.Template" />
      <AASEditor
        v-model="item"
        class="h-[calc(100dvh-var(--layout-header-h,64px))]"
        :type="DigitalProductDocumentType.Template"
      />
    </template>
  </section>
</template>
