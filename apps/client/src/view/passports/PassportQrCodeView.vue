<script lang="ts" setup>
import type { UniqueProductIdentifierDto } from "@open-dpp/api-client";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import QrCode from "../../components/QrCode.vue";
import { VIEW_ROOT_URL } from "../../const";
import apiClient from "../../lib/api-client";

const route = useRoute();
const upids = ref<UniqueProductIdentifierDto[] | undefined>(undefined);
const upidNotFound = ref(false);
const { t } = useI18n();

onMounted(async () => {
  const result = await apiClient.dpp.uniqueProductIdentifiers.getByReference(
    String(route.params.passportId),
  );

  upids.value = result.data;
});

const link = computed(() =>
  upids.value && upids.value[0] ? `/presentation/${upids.value[0].uuid}` : undefined,
);
const content = computed(() => (link.value ? `${VIEW_ROOT_URL}${link.value}` : undefined));
</script>

<template>
  <QrCode v-if="link && content && !upidNotFound" :link="link" :content="content" />
  <div
    v-if="!upids || !upids[0]"
    class="flex w-full flex-col items-center justify-center gap-5 p-10"
  >
    <span>
      {{ t("uniqueproductidentifier.notfound") }}
    </span>
  </div>
</template>
