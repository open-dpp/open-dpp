<template>
  <QrCode v-if="url" :url="url" />
</template>
<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { VIEW_ROOT_URL } from "../../const";
import QrCode from "../../components/QrCode.vue";
import apiClient from "../../lib/api-client";

const route = useRoute();
const url = ref<string>();

onMounted(async () => {
  const response = await apiClient.dpp.items.getById(
    String(route.params.modelId),
    String(route.params.itemId),
  );
  const item = response.data;
  url.value = `${VIEW_ROOT_URL}/${item.uniqueProductIdentifiers[0].uuid}`;
});
</script>
