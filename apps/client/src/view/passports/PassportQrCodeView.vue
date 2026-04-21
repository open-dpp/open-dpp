<script lang="ts" setup>
import type { PermalinkDto } from "@open-dpp/api-client";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import QrCode from "../../components/QrCode.vue";
import { VIEW_ROOT_URL } from "../../const";
import apiClient from "../../lib/api-client";

const route = useRoute();
const permalinks = ref<PermalinkDto[] | undefined>(undefined);
const permalinkNotFound = ref(false);
const { t } = useI18n();

onMounted(async () => {
  const result = await apiClient.dpp.permalinks.getByPassport(
    String(route.params.passportId),
  );

  permalinks.value = result.data;
});

const link = computed(() => {
  const first = permalinks.value?.[0];
  if (!first) return undefined;
  return `/p/${first.slug ?? first.id}`;
});
const content = computed(() => (link.value ? `${VIEW_ROOT_URL}${link.value}` : undefined));
</script>

<template>
  <QrCode v-if="link && content && !permalinkNotFound" :link="link" :content="content" />
  <div
    v-if="!permalinks || !permalinks[0]"
    class="flex w-full flex-col items-center justify-center gap-5 p-10"
  >
    <span>
      {{ t("permalink.notfound") }}
    </span>
  </div>
</template>
