<script lang="ts" setup>
import type { UniqueProductIdentifierDto } from "@open-dpp/api-client";
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import QrCode from "../../components/QrCode.vue";
import apiClient from "../../lib/api-client";

const route = useRoute();
const link = ref<string>();
const content = ref<string>();

onMounted(async () => {
  const response = await apiClient.dpp.items.getById(
    String(route.params.modelId),
    String(route.params.itemId),
  );
  const item = response.data;
  const uqi = item.uniqueProductIdentifiers[0] as UniqueProductIdentifierDto;
  link.value = `/presentation/${uqi.uuid}`;
  content.value = `/presentation/${uqi.uuid}`;
});
</script>

<template>
  <QrCode v-if="link && content" :link="link" :content="content" />
</template>
